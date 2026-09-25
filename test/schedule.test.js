const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function generatedState(afterGenerate = '') {
  const nodes = new Map();
  const stub = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {
      innerHTML: '', textContent: '',
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}
    });
    return nodes.get(selector);
  };
  const context = {
    console, Date, setTimeout, clearTimeout, Blob, URL,
    FileReader: class {},
    document: { querySelector: stub, querySelectorAll() { return []; } },
    localStorage: { getItem() { return null; }, setItem() {} },
    fieldRows: JSON.parse(fs.readFileSync('fields.json', 'utf8')).results
  };
  vm.createContext(context);
  const source = fs.readFileSync('app.js', 'utf8');
  vm.runInContext(`${source}\nstate = loadState(mapFieldTemplate(fieldRows)); generateSchedule(); ${afterGenerate}\nglobalThis.generated = state;`, context);
  return context.generated;
}

const toMinutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));

test('Spring 2026 source rules are mapped to dates, slots, and fields', () => {
  const state = generatedState();
  assert.equal(state.season.timezone, 'America/New_York');
  assert.equal(state.season.name, 'Spring 2026');
  assert.equal(state.season.start, '2026-05-06');
  assert.equal(state.season.end, '2026-06-30');
  assert.equal(state.season.weekendStart, '10:00');
  assert.equal(state.divisions.length, 11);
  assert.equal(state.fields.length, 28);
  assert.equal(state.fields.filter(field => !field.closed).length, 27);
  assert.equal(state.schedule.length + state.unassigned.length, 540);

  const expected = {
    tb1:['2026-05-08','2026-06-21',['Sun','Sat'],[43,45,47],14],
    tb2:['2026-05-07','2026-06-25',['Mon','Wed','Fri'],[27,29,31,33,35,37,39,41],12],
    sb8:['2026-05-06','2026-06-25',['Tue','Wed','Thu'],[43,33,35,37,39,41],8],
    bb8:['2026-05-07','2026-06-22',['Tue','Wed','Thu'],[27,29,31,33,35,41],15],
    bb10:['2026-05-06','2026-06-19',['Mon','Wed','Fri'],[17,19,21,23,25],11],
    sb10:['2026-05-06','2026-06-22',['Mon','Wed','Fri'],[33,35,37],7],
    bb12:['2026-05-07','2026-06-19',['Tue','Wed','Thu'],[17,19,21,23,25],10],
    sb12:['2026-05-06','2026-06-19',['Tue','Thu'],[15,89],4],
    sb17:['2026-05-17','2026-06-30',['Mon','Wed','Fri'],[15,89,91],5],
    bb14:['2026-05-07','2026-06-19',['Mon','Wed','Fri'],[11,93],4]
  };
  for (const [id, rule] of Object.entries(expected)) {
    const division = state.divisions.find(item => item.id === id);
    assert.equal(division.start, rule[0]);
    assert.equal(division.end, rule[1]);
    assert.deepEqual([...division.days], rule[2]);
    assert.deepEqual([...division.fieldSourceIds], rule[3]);
    assert.equal(division.teamCount, rule[4]);
    assert.equal(division.teams.length, rule[4]);
  }
  assert.equal(state.divisions.find(division => division.id === 'bb18').enabled, false);
  for (const division of state.divisions.filter(item => item.enabled)) {
    const games = state.schedule.filter(game => game.divisionId === division.id);
    assert.equal(games.length, division.teamCount * division.gamesPerTeam / 2, division.name);
    assert.equal(division.gamesPerTeam, 12);
    assert.equal(division.gameCountOverride, false);
    assert.ok(division.teams.every(team => games.filter(game => game.homeId === team.id || game.awayId === team.id).length === 12), `${division.name} teams should each play twelve games`);
  }
});

test('weekend starts and flexible weekly cadence follow WYBSL policy', () => {
  const state = generatedState();
  const weekendGames = state.schedule.filter(game => [0, 6].includes(new Date(`${game.date}T12:00:00`).getDay()));
  const saturdayGames = state.schedule.filter(game => new Date(`${game.date}T12:00:00`).getDay() === 6);
  assert.ok(weekendGames.length > 0);
  assert.ok(weekendGames.every(game => toMinutes(game.time) >= 10 * 60));
  assert.ok(saturdayGames.length > 0, 'expected Saturdays for an eligible division');
  assert.ok(saturdayGames.every(game => state.divisions.find(division => division.id === game.divisionId).days.includes('Sat') || (game.attention && game.dayException)), 'nonstandard Saturday games must be flagged');
  assert.ok(saturdayGames.filter(game => game.divisionId !== 'tb1').every(game => game.dayException));

  const teeBall = state.divisions.find(division => division.id === 'tb1');
  const team = teeBall.teams[0];
  const weeklyCounts = new Map();
  for (const game of state.schedule.filter(item => item.homeId === team.id || item.awayId === team.id)) {
    const sunday = new Date(`${game.date}T12:00:00`);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    const key = sunday.toISOString().slice(0, 10);
    weeklyCounts.set(key, (weeklyCounts.get(key) || 0) + 1);
  }
  assert.ok([...weeklyCounts.values()].includes(1), 'expected at least one one-game week');
  assert.ok([...weeklyCounts.values()].includes(2), 'expected at least one two-game week');
  assert.ok([...weeklyCounts.values()].every(count => count <= 2));

  let adjacentGames = 0, adjacentPairs = 0;
  for (const division of state.divisions) {
    for (const scheduledTeam of division.teams) {
      const dates = state.schedule.filter(game => game.homeId === scheduledTeam.id || game.awayId === scheduledTeam.id).map(game => new Date(`${game.date}T12:00:00`)).sort((a, b) => a - b);
      for (let index = 1; index < dates.length; index++) {
        adjacentPairs++;
        if ((dates[index] - dates[index - 1]) / 86400000 === 1) adjacentGames++;
      }
    }
  }
  assert.ok(adjacentGames / adjacentPairs <= .15, 'back-to-back games should remain uncommon');
});

test('generated games obey field, team, compatibility, and daylight constraints', () => {
  const state = generatedState();
  for (const game of state.schedule) {
    const division = state.divisions.find(item => item.id === game.divisionId);
    const field = state.fields.find(item => item.id === game.fieldId);
    if (!field.divisions.includes(game.divisionId)) assert.ok(game.attention && game.fieldException, `${game.id} field exception must be flagged`);
    assert.ok(game.date >= division.start && game.date <= division.end, `${game.id} division date window`);
    const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(`${game.date}T12:00:00`).getDay()];
    if (!division.days.includes(day)) assert.ok(game.attention && game.dayException, `${game.id} day exception must be flagged`);
    else assert.ok(division.startTimes[day].includes(game.time), `${game.id} configured start time`);
    assert.ok(toMinutes(game.time) + game.duration + state.season.safetyBuffer <= toMinutes(state.season.daylight), `${game.id} daylight`);
  }
  for (const division of state.divisions.filter(item => item.enabled)) {
    for (const team of division.teams) {
      const games = state.schedule.filter(game => game.homeId === team.id || game.awayId === team.id);
      const home = games.filter(game => game.homeId === team.id).length;
      assert.ok(Math.abs(home - (games.length - home)) <= 2, `${division.name}: ${team.name} home/away imbalance`);
    }
  }
  for (let left = 0; left < state.schedule.length; left++) {
    for (let right = left + 1; right < state.schedule.length; right++) {
      const a = state.schedule[left], b = state.schedule[right];
      if (a.date !== b.date) continue;
      const sharedTeam = [a.homeId, a.awayId].some(id => id === b.homeId || id === b.awayId);
      assert.equal(sharedTeam, false, `${a.id} and ${b.id} team doubleheader`);
      if (a.fieldId !== b.fieldId) continue;
      const overlap = toMinutes(a.time) < toMinutes(b.time) + b.duration + 15 && toMinutes(b.time) < toMinutes(a.time) + a.duration + 15;
      assert.equal(overlap, false, `${a.id} and ${b.id} field overlap`);
    }
  }
});

test('second pass recovers failures and marks every adjustment', () => {
  const state = generatedState();
  assert.equal(state.schedule.length, 540);
  assert.equal(state.unassigned.length, 0);
  const adjustments = state.schedule.filter(game => game.attention);
  assert.ok(adjustments.length > 0);
  assert.ok(adjustments.every(game => game.adjustment.originalReason !== 'The two teams have no shared eligible date in this scheduling round'), 'ordinary league dates must be exhausted before recovery');
  assert.ok(adjustments.every(game => game.fieldException || game.dayException), 'normal date, time, and assigned-field placements must not be flagged');
  for (const game of adjustments) {
    assert.match(game.id, /^WYB-\d{4}$/);
    assert.ok(game.divisionName);
    assert.ok(game.homeName);
    assert.ok(game.awayName);
    assert.ok(game.adjustment.type);
    assert.ok(game.adjustment.originalReason);
    assert.ok(game.adjustment.summary);
    assert.ok(game.adjustment.selected);
    assert.ok(Array.isArray(game.adjustment.alternatives));
    assert.match(game.adjustment.selected, /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat),/);
    assert.ok(game.adjustment.alternatives.every(option => /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat),/.test(option)));
    assert.ok(game.adjustment.originalPlan);
    assert.equal(game.adjustment.batch.id, `schedule-v${state.version}`);
    assert.equal(game.adjustment.batch.kind, 'schedule');
    assert.ok(game.adjustment.originalPlan.assignedFields.length > 0);
    assert.ok(game.adjustment.resolution.searchSteps.length >= 3);
    assert.ok(game.adjustment.resolution.preserved.includes('No team doubleheaders'));
    assert.ok(game.adjustment.resolution.whySelected);
  }
});

test('rainout workbench drafts exact weekend makeup windows and marks applied games', () => {
  const state = generatedState(`
    const canceled = state.schedule.find(game => !['Sat','Sun'].includes(DAY_NAMES[dateObj(game.date).getDay()]));
    state.rainoutDate = canceled.date;
    state.selectedRainouts = [canceled.id];
    findRepairs();
    state.__rainoutProposal = clone(state.repairs);
    handleAction('apply-repairs');
    state.__adjustmentHtml = renderAdjustmentDiagnostics(state.schedule.filter(game => game.attention));
  `);
  assert.equal(state.__rainoutProposal.length, 1);
  const proposal = state.__rainoutProposal[0];
  const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(`${proposal.newDate}T12:00:00`).getDay()];
  assert.ok(['Sat', 'Sun'].includes(day));
  assert.ok((day === 'Sat' ? ['10:00', '13:00', '16:00'] : ['13:00', '16:00']).includes(proposal.newTime));
  assert.ok(proposal.divisionName);
  assert.ok(proposal.homeName);
  assert.ok(proposal.awayName);

  const moved = state.schedule.find(game => game.id === proposal.gameId);
  assert.equal(moved.date, proposal.newDate);
  assert.equal(moved.time, proposal.newTime);
  assert.equal(moved.attention, true);
  assert.equal(moved.adjustment.type, 'Rainout makeup');
  assert.equal(moved.adjustment.batch.kind, 'rainout');
  assert.match(moved.adjustment.batch.label, /^Rainout makeup draft/);
  assert.equal(moved.adjustment.originalPlan.attemptedDates[0], proposal.oldDate);
  assert.ok(moved.adjustment.resolution.searchSteps.some(step => step.includes('Saturday')));
  assert.ok(moved.previous.date);
  assert.ok(state.__adjustmentHtml.indexOf('Rainout makeup draft') < state.__adjustmentHtml.indexOf('Schedule recovery'));
  assert.match(state.__adjustmentHtml, /<details class="adjustment-draft" open><summary><span><strong>Rainout makeup draft/);
});

test('rainout select all chooses every game on the simulated date at game level', () => {
  const state = generatedState(`
    state.rainoutDate = state.schedule[0].date;
    handleAction('select-all-rainouts');
  `);
  const gamesOnDate = state.schedule.filter(game => game.date === state.rainoutDate && game.status === 'scheduled');
  assert.ok(gamesOnDate.length > 0);
  assert.equal([...state.selectedRainouts].sort().join(','), [...gamesOnDate].map(game => game.id).sort().join(','));
  assert.equal(state.rainoutClosedFields.length, 0);
});
