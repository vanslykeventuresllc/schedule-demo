const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const COLORS = ['#2f69a1','#a85578','#d28630','#287a5a','#7667a7','#397a85','#a65b45','#667788','#4d7d52','#9a6b35','#5669a4'];

const divisionSeeds = [
  ['tb1','Tee-Ball I','Tee-ball',['Sat','Sun'],2,'Volunteer',75],
  ['tb2','Tee-Ball II','Tee-ball',['Mon','Wed','Fri'],4,'Volunteer',75],
  ['sb8','8U Softball','Softball',['Tue','Wed','Thu'],6,'Volunteer',90],
  ['sb10','10U Softball','Softball',['Mon','Wed','Fri'],6,'Trained',90],
  ['sb12','12U Softball','Softball',['Tue','Wed','Thu'],6,'Trained',105],
  ['sb17','17U Softball','Softball',['Mon','Wed','Fri'],7,'Certified',120],
  ['bb8','8U Baseball','Baseball',['Tue','Wed','Thu'],6,'Volunteer',90],
  ['bb10','10U Baseball','Baseball',['Mon','Wed','Fri'],6,'Trained',105],
  ['bb12','12U Baseball','Baseball',['Tue','Wed','Thu'],6,'Trained',105],
  ['bb14','14U Baseball','Baseball',['Mon','Wed','Fri'],7,'Certified',120],
  ['bb18','18U Baseball','Baseball',['Mon','Wed','Fri'],7,'Certified',120]
];

function teamsFor(div) {
  const names = ['Falcons','Hawks','Cardinals','Blue Jays','Orioles','Robins','Eagles','Owls'];
  return Array.from({length: div.teamCount || 6}, (_,i) => ({ id: `${div.id}-t${i+1}`, name: names[i] || `Team ${i+1}`, availableDays:[...(div.days||[])] }));
}

const baseDivisions = divisionSeeds.map((d,i) => ({
  id:d[0], name:d[1], sport:d[2], days:d[3], innings:d[4], official:d[5], duration:d[6], teamCount:6,
  gamesPerTeam:12, gameCountOverride:false, format:'Balanced 12-game rotation', gamesPerWeek:2, officialCount:d[5] === 'Volunteer' ? 0 : (d[5] === 'Certified' ? 2 : 1), color:COLORS[i], teams:[]
}));

const spring2026Rules = {
  tb1:{name:'Co-ed Tee-ball I (4/5)',teamCount:14,start:'2026-05-08',end:'2026-06-21',startTimes:{Sun:['13:00','15:00'],Sat:['10:00','12:00','14:00']},fieldSourceIds:[43,45,47]},
  tb2:{name:'Co-ed Tee-Ball',teamCount:12,start:'2026-05-07',end:'2026-06-25',startTimes:{Mon:['18:30'],Wed:['18:30'],Fri:['18:30']},fieldSourceIds:[27,29,31,33,35,37,39,41]},
  sb8:{name:'7U Coach Pitch Softball',teamCount:8,start:'2026-05-06',end:'2026-06-25',startTimes:{Tue:['18:30'],Wed:['18:30'],Thu:['18:30']},fieldSourceIds:[43,33,35,37,39,41]},
  bb8:{name:'7U Coach Pitch Baseball',teamCount:15,start:'2026-05-07',end:'2026-06-22',startTimes:{Tue:['18:30'],Wed:['18:30'],Thu:['18:30']},fieldSourceIds:[27,29,31,33,35,41]},
  bb10:{name:'9U Green Hat Baseball',teamCount:11,start:'2026-05-06',end:'2026-06-19',startTimes:{Mon:['18:30'],Wed:['18:30'],Fri:['18:30']},fieldSourceIds:[17,19,21,23,25]},
  sb10:{name:'9U Green Hat Softball',teamCount:7,start:'2026-05-06',end:'2026-06-22',startTimes:{Mon:['18:30'],Wed:['18:30'],Fri:['18:30']},fieldSourceIds:[33,35,37]},
  bb12:{name:'11U Red Hat Baseball',teamCount:10,start:'2026-05-07',end:'2026-06-19',startTimes:{Tue:['18:30'],Wed:['18:30'],Thu:['18:30']},fieldSourceIds:[17,19,21,23,25]},
  sb12:{name:'11U Red Hat Softball',teamCount:4,start:'2026-05-06',end:'2026-06-19',startTimes:{Tue:['18:30'],Thu:['18:30']},fieldSourceIds:[15,89]},
  sb17:{name:'16U Blue Hat Softball',teamCount:5,start:'2026-05-17',end:'2026-06-30',startTimes:{Mon:['18:30'],Wed:['18:30'],Fri:['18:30']},fieldSourceIds:[15,89,91]},
  bb14:{name:'13U Blue Hat Baseball',teamCount:4,start:'2026-05-07',end:'2026-06-19',startTimes:{Mon:['18:15'],Wed:['18:15'],Fri:['18:15']},fieldSourceIds:[11,93]},
  bb18:{name:'18U(S) & 17U(Fall) Black Hat BB',teamCount:1,start:null,end:null,startTimes:{},fieldSourceIds:[],enabled:false}
};

const defaultDivisions = baseDivisions.map(division => {
  const rule=spring2026Rules[division.id],days=Object.keys(rule.startTimes);
  const configured={...division,...rule,days,enabled:rule.enabled!==false,format:'Balanced 12-game rotation'};
  return {...configured,teams:teamsFor(configured)};
});

function mapFieldTemplate(rows) {
  return rows.map(row => {
    const awayPlaceholder = String(row.name).toLowerCase() === 'away game';
    return {
      id: `field-${row.field_id}`,
      sourceId: row.field_id,
      locationId: row.field_location_id,
      name: awayPlaceholder ? `${row.field_location_short_name} — Away Game` : `${row.field_location_short_name} ${row.name}`,
      fieldNumber: row.name,
      complex: row.field_location_name,
      complexShortName: row.field_location_short_name,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      type: 'unverified',
      divisions: awayPlaceholder ? [] : defaultDivisions.filter(division => division.fieldSourceIds.includes(row.field_id)).map(division => division.id),
      lights: false,
      weekdayOpen: '18:00',
      weekendOpen: '10:00',
      close: '21:00',
      turnover: 15,
      closed: awayPlaceholder,
      source: 'fields.json'
    };
  });
}

const defaults = {
  activeView:'overview', season:{name:'Spring 2026',start:'2026-05-06',end:'2026-06-30',timezone:'America/New_York',weekdayStart:'18:15',weekendStart:'10:00',daylight:'21:00',safetyBuffer:15,holidays:[],source:'Spring 2026 schedule rules',sourceDate:'spring_2026_schedule_rules.png'},
  fieldTemplateVersion:3, seasonPolicyVersion:3, cadencePolicyVersion:7, diagnosticVersion:2, divisions:defaultDivisions, fields:[],
  rules:{noOverlap:true,noDoubleheaders:true,compatibleFields:true,daylight:true,officialCoverage:true,lockedGames:true,homeAwayLimit:true,normalDays:9,homeAway:10,earlyLate:7,opponentSpacing:7,avoidConsecutive:10,saturdayMix:8,makeupSunday:9,spareCapacity:5,minimizeChanges:10},
  schedule:[], unassigned:[], version:0, status:'draft', generatedAt:null, postponed:[], repairs:[], repairFailures:[], selectedRainouts:[], rainoutDate:null, rainoutClosedFields:[], scheduleFilter:'all', scheduleView:'calendar'
};

function clone(v){ return JSON.parse(JSON.stringify(v)); }
function loadState(templateFields=[]){
  try {
    const saved=JSON.parse(localStorage.getItem('wybsl-demo'));
    if (!saved) return {...clone(defaults),fields:clone(templateFields)};
    const templateChanged=saved.fieldTemplateVersion!==defaults.fieldTemplateVersion;
    const seasonPolicyChanged=saved.seasonPolicyVersion!==defaults.seasonPolicyVersion;
    const cadencePolicyChanged=saved.cadencePolicyVersion!==defaults.cadencePolicyVersion;
    const diagnosticChanged=saved.diagnosticVersion!==defaults.diagnosticVersion;
    const season=seasonPolicyChanged?clone(defaults.season):{...clone(defaults.season),...saved.season,timezone:'America/New_York',weekendStart:'10:00'};
    const divisions=cadencePolicyChanged?(saved.divisions||clone(defaults.divisions)).map(division=>{
      const authoritative=defaults.divisions.find(item=>item.id===division.id);
      if(!authoritative)return division;
      const days=[...authoritative.days];
      const teams=teamsFor(authoritative).map((team,index)=>({...team,name:division.teams?.[index]?.name||team.name,availableDays:[...days]}));
      return {...division,name:authoritative.name,teamCount:authoritative.teamCount,gamesPerTeam:12,gameCountOverride:false,format:authoritative.format,start:authoritative.start,end:authoritative.end,startTimes:clone(authoritative.startTimes),fieldSourceIds:[...authoritative.fieldSourceIds],enabled:authoritative.enabled,days,teams};
    }):saved.divisions;
    const rules={...clone(defaults.rules),...saved.rules,avoidConsecutive:cadencePolicyChanged?10:(saved.rules?.avoidConsecutive??10)};
    const invalidateDraft=templateChanged||seasonPolicyChanged||cadencePolicyChanged||diagnosticChanged;
    return {...clone(defaults),...saved,season,divisions,rules,fieldTemplateVersion:defaults.fieldTemplateVersion,seasonPolicyVersion:defaults.seasonPolicyVersion,cadencePolicyVersion:defaults.cadencePolicyVersion,diagnosticVersion:defaults.diagnosticVersion,fields:templateChanged?clone(templateFields):saved.fields,schedule:invalidateDraft?[]:saved.schedule,unassigned:invalidateDraft?[]:saved.unassigned,version:invalidateDraft?0:saved.version,status:invalidateDraft?'draft':saved.status};
  }
  catch { return {...clone(defaults),fields:clone(templateFields)}; }
}
let state;
const app=document.querySelector('#app');

function save(message='Saved locally'){
  localStorage.setItem('wybsl-demo',JSON.stringify(state));
  document.querySelector('#save-status').textContent=`● ${message}`;
  document.querySelector('#header-season').textContent=state.season.name;
}
function toast(message){ const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2500); }
function dateObj(value){ return new Date(`${value}T12:00:00`); }
function dateISO(d){ const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function addDays(value,n){ const d=dateObj(value); d.setDate(d.getDate()+n); return dateISO(d); }
function prettyDate(value,opts={month:'short',day:'numeric'}){ return dateObj(value).toLocaleDateString('en-US',opts); }
function gameDate(value){ return prettyDate(value,{weekday:'short',month:'short',day:'numeric'}); }
function weekdayLabel(value){
 const label=String(value??'');
 if(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat),/.test(label))return label;
 const match=label.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})\b/);
 if(!match)return label;
 const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],year=Number(state?.season?.start?.slice(0,4))||new Date().getFullYear(),date=new Date(year,months.indexOf(match[1]),Number(match[2]),12);
 return label.replace(match[0],`${DAY_NAMES[date.getDay()]}, ${match[0]}`);
}
function esc(v){ return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function input(label,name,value,type='text',help=''){ return `<div class="field-group"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}">${help?`<small>${help}</small>`:''}</div>`; }
function heading(kicker,title,subtitle,actions=''){ return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${actions?`<div class="button-row">${actions}</div>`:''}</div>`; }
function badge(label,tone=''){ return `<span class="badge ${tone}">${label}</span>`; }
function gameTotal(){ return state.divisions.filter(d=>d.enabled!==false).reduce((sum,d)=>sum+(d.teamCount*d.gamesPerTeam/2),0); }
function fieldCoverage(div){ return state.fields.filter(f=>!f.closed&&f.divisions.includes(div.id)).length; }

function render(){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===state.activeView));
  const renderers={overview:renderOverview,season:renderSeason,divisions:renderDivisions,fields:renderFields,rules:renderRules,schedule:renderSchedule,rainouts:renderRainouts,export:renderExport};
  app.innerHTML=renderers[state.activeView]();
  bindView();
}

function renderOverview(){
  const generated=state.schedule.length;
  return `${heading(`${state.season.name} planning`,'Build a schedule everyone can play.','Configure league rules, generate a balanced draft, and resolve rainouts without touching the live WYBSL system.',`<button class="btn secondary" data-go="season">Review setup</button><button class="btn blue" data-action="generate">${generated?'Regenerate':'Generate draft'} →</button>`)}
  <div class="grid four">
    <div class="card metric"><div class="metric-label">Divisions</div><div class="metric-value">${state.divisions.length}</div><div class="metric-note good">✓ ${state.divisions.reduce((s,d)=>s+d.teamCount,0)} teams configured</div></div>
    <div class="card metric"><div class="metric-label">Expected games</div><div class="metric-value">${gameTotal()}</div><div class="metric-note">${state.divisions[0]?.gamesPerTeam||0} games per team default</div></div>
    <div class="card metric"><div class="metric-label">Available fields</div><div class="metric-value">${state.fields.filter(f=>!f.closed).length}</div><div class="metric-note">${state.fields.filter(f=>f.lights).length} with lights · ${state.fields.filter(f=>f.closed).length} closed</div></div>
    <div class="card metric"><div class="metric-label">Draft status</div><div class="metric-value" style="font-size:24px;text-transform:capitalize">${state.schedule.length?state.status:'Not generated'}</div><div class="metric-note ${state.unassigned.length?'':'good'}">${state.schedule.length?`${state.schedule.length} placed · ${state.unassigned.length} unresolved`:'Ready when setup is complete'}</div></div>
  </div>
  <div class="split-layout section-gap">
    <section class="card pad"><div style="display:flex;justify-content:space-between;align-items:center"><div><p class="eyebrow">Setup progress</p><h2>Ready to generate</h2></div>${badge('4 of 4 complete','green')}</div>
      <div class="setup-list">
        ${[['season','Season dates & operating hours',`${prettyDate(state.season.start)}–${prettyDate(state.season.end)} · Eastern Time`],['divisions','Divisions & teams',`${state.divisions.length} divisions · ${state.divisions.reduce((s,d)=>s+d.teamCount,0)} teams · ${gameTotal()} games`],['fields','Fields & compatibility',`${state.fields.length} fields · ${state.fields.reduce((s,f)=>s+f.divisions.length,0)} eligibility mappings`],['rules','Rules & priorities','7 hard constraints · 9 weighted preferences']].map((x,i)=>`<div class="setup-item"><div class="step-number">✓</div><div><strong>${x[1]}</strong><p>${x[2]}</p></div><button class="text-link" data-go="${x[0]}">Edit</button></div>`).join('')}
      </div>
    </section>
    <aside class="grid">
      <div class="card pad"><p class="eyebrow">Capacity outlook</p><h3>Season feasibility</h3><div class="divider"></div><div class="mini-bars">
        <div class="mini-bar"><span>Field capacity</span><div class="progress"><span style="width:82%"></span></div><b>82%</b></div>
        <div class="mini-bar"><span>Daylight window</span><div class="progress"><span style="width:76%"></span></div><b>76%</b></div>
        <div class="mini-bar"><span>Official data</span><div class="progress"><span style="width:28%;background:#d28630"></span></div><b>28%</b></div>
      </div>
      <div class="callout warning"><span>!</span><div><strong>Umpire coverage is provisional</strong><p>Qualification requirements are configured, but no individual availability has been supplied. Generated games will be labeled unverified.</p></div></div>
    </aside>
  </div>`;
}

function renderSeason(){
 return `${heading('Configure','Season setup','Define the calendar boundary and operating policy. These values are used by every division and field.')}
 <form id="season-form" class="grid">
  <section class="card"><div class="card-header"><div><h3>Season details</h3><p>Spring 2026 source dates are already filled in.</p></div>${badge('Required','blue')}</div><div class="card-body"><div class="form-grid three">
   ${input('Season name','name',state.season.name)}${input('Opening day','start',state.season.start,'date')}${input('Regular season ends','end',state.season.end,'date')}
   ${input('Earliest weekday start','weekdayStart',state.season.weekdayStart,'time','Discovery default: 6:00 PM in spring.')}${input('Earliest weekend start','weekendStart',state.season.weekendStart,'time','WYBSL weekend games begin at 10:00 AM.')}
  </div></div></section>
  <div class="callout"><span>◷</span><div><strong>Eastern Time</strong><p>All dates, operating windows, and exported game times use America/New_York. This is fixed for WYBSL and does not require configuration.</p></div></div>
  <div class="grid two"><section class="card"><div class="card-header"><div><h3>Daylight & safety</h3><p>No configured fields have lights by default.</p></div></div><div class="card-body"><div class="form-grid">${input('Usable daylight cutoff','daylight',state.season.daylight,'time')}${input('Safety buffer (minutes)','safetyBuffer',state.season.safetyBuffer,'number')}</div><div class="callout warning section-gap"><span>☀</span><div><strong>Date-specific sunset is not connected</strong><p>This local demo uses the configurable cutoff. Verify it against actual civil twilight before publishing.</p></div></div></div></section>
  <section class="card"><div class="card-header"><div><h3>Holidays & blocked dates</h3><p>One date per line, formatted YYYY-MM-DD.</p></div></div><div class="card-body"><div class="field-group"><label>League-wide closures</label><textarea name="holidays" rows="5">${state.season.holidays.join('\n')}</textarea><small>Field-specific closures can be managed under Fields.</small></div></div></section></div>
  <section class="card"><div class="card-header"><div><h3>Existing schedule source</h3><p>The external WYBSL service remains authoritative.</p></div><button type="button" class="btn secondary small" data-action="open-import">Import CSV</button></div><div class="card-body"><div class="inline-stat"><span><strong>Source</strong>${state.season.source}</span><span><strong>Last captured</strong>${state.season.sourceDate}</span><span><strong>Stable IDs</strong>${state.schedule.some(g=>g.imported)?'Preserved where supplied':'Not yet verified'}</span></div><div class="callout section-gap"><span>i</span><div><strong>Planning copy only</strong><p>Imports never write back to the current system. Reconcile against the latest external schedule before approving changes.</p></div></div></div></section>
  <div class="button-row" style="justify-content:flex-end"><button type="submit" class="btn blue">Save season settings</button></div>
 </form>`;
}

function renderDivisions(){
 return `${heading('Configure','Divisions & teams','Review all 11 seeded league divisions. Every row can be edited, including days, duration, format, game count, and umpire needs.',`<button class="btn secondary" data-action="add-division">+ Add division</button>`)}
 <div class="callout warning"><span>!</span><div><strong>Spring 2026 operational template</strong><p>Division windows, day/time slots, and field assignments come from spring_2026_schedule_rules.png. Game durations and official requirements remain discovery assumptions.</p></div></div>
 <section class="card section-gap"><div class="card-header"><div><h3>Division rules</h3><p>${state.divisions.reduce((s,d)=>s+d.teamCount,0)} teams across ${state.divisions.length} divisions</p></div>${badge(`${gameTotal()} expected games`,'blue')}</div><div class="table-wrap"><table><thead><tr><th>Division</th><th>Date window</th><th>Days / times</th><th>Teams</th><th>Games / team</th><th>Duration</th><th>Fields</th><th></th></tr></thead><tbody>
 ${state.divisions.map(d=>`<tr><td><span class="team-dot" style="background:${d.color}"></span><strong>${esc(d.name)}</strong><div class="muted" style="margin-left:18px;font-size:10px">${d.enabled===false?'Not configured':`${d.sport} · ${d.format}`}</div></td><td>${d.start&&d.end?`${prettyDate(d.start)}–${prettyDate(d.end)}`:badge('Not supplied','amber')}</td><td>${d.days.length?d.days.map(day=>`${day} ${((d.startTimes||{})[day]||[]).map(formatTime).join(' / ')}`).join('<br>'):'—'}</td><td>${d.teamCount}</td><td><strong>${d.gamesPerTeam}</strong> ${d.gameCountOverride?badge('Override','amber'):badge('Default','blue')}</td><td>${d.duration} min</td><td>${fieldCoverage(d)} assigned</td><td><button class="text-link" data-edit-division="${d.id}">Edit</button></td></tr>`).join('')}
 </tbody></table></div></section>`;
}

function renderFields(){
 const open=state.fields.filter(f=>!f.closed).length;
 return `${heading('Configure','Fields & resources','Manage eligibility, hours, lights, turnover, and closures for each playable resource.',`<button class="btn secondary" data-action="add-field">+ Add field</button>`)}
 <div class="callout warning"><span>!</span><div><strong>Assignments loaded; physical compatibility unverified</strong><p>Names and addresses come from fields.json, while division assignments come from the Spring 2026 rules image. The source does not specify dimensions, so physical configuration still requires verification. “Away Game” remains closed.</p></div></div>
 <div class="grid three section-gap"><div class="card metric"><div class="metric-label">Field inventory</div><div class="metric-value">${state.fields.length}</div><div class="metric-note">Across ${new Set(state.fields.map(f=>f.complex)).size} complexes</div></div><div class="card metric"><div class="metric-label">Available</div><div class="metric-value">${open}</div><div class="metric-note good">${state.fields.length-open} currently closed</div></div><div class="card metric"><div class="metric-label">Fields with lights</div><div class="metric-value">${state.fields.filter(f=>f.lights).length}</div><div class="metric-note">Discovery default: none</div></div></div>
 <section class="card section-gap"><div class="table-wrap"><table><thead><tr><th>Field</th><th>Configuration</th><th>Eligible divisions</th><th>Hours</th><th>Turnover</th><th>Status</th><th></th></tr></thead><tbody>${state.fields.map(f=>`<tr><td><strong>${esc(f.name)}</strong><div class="muted" style="font-size:10px">${esc(f.complex)}${f.sourceId?` · Source ID ${f.sourceId}`:''} · ${esc(f.address||'Address not supplied')}</div></td><td>${f.type==='unverified'?badge('Eligibility unverified','amber'):`${f.type} diamond`} ${f.lights?badge('Lights','blue'):''}</td><td>${f.divisions.length} divisions</td><td>Weekdays ${formatTime(f.weekdayOpen)}–${formatTime(f.close)}</td><td>${f.turnover} min</td><td>${f.closed?badge('Closed','red'):badge('Available','green')}</td><td><button class="text-link" data-edit-field="${f.id}">Edit</button></td></tr>`).join('')}</tbody></table></div></section>`;
}

function renderRules(){
 const hard=[['noOverlap','Prevent field and team overlaps','Games may not overlap on a field or for either participating team.'],['noDoubleheaders','No same-day doubleheaders','An administrator must authorize a narrow, game-specific exception.'],['compatibleFields','Require division-compatible fields','Every game must use a field configured for its division.'],['daylight','Finish before usable daylight cutoff','Game duration and the safety buffer must fit before the cutoff.'],['homeAwayLimit','Limit home / away imbalance','No team may finish more than one game away from an even split (for example, 6–4 is allowed; 7–3 is not).'],['officialCoverage','Validate required official capacity','Missing data is labeled unverified, never confirmed.'],['lockedGames','Protect published or locked games','Repair proposals leave unaffected published games unchanged.']];
 const soft=[['normalDays','Favor eligible division days'],['homeAway','Balance home and away'],['earlyLate','Balance early and late starts'],['opponentSpacing','Space repeat opponents'],['avoidConsecutive','Avoid consecutive-day games'],['saturdayMix','Use Saturdays when eligible'],['makeupSunday','Prefer Sunday makeups'],['spareCapacity','Preserve spare field capacity'],['minimizeChanges','Minimize published schedule changes']];
 return `${heading('Configure','Rules & priorities','Hard constraints preserve safety and validity. Soft priorities guide the best choice among valid schedules.')}
 <div class="tabs"><button class="tab active">Hard constraints</button><button class="tab">Optimization priorities</button><button class="tab">Overrides & audit</button></div>
 <div class="grid two"><section class="card"><div class="card-header"><div><h3>Required rules</h3><p>Never silently violated by the generator.</p></div>${badge('Hard constraints','red')}</div><div class="card-body rule-list">${hard.map(r=>`<div class="rule-row"><button class="toggle ${state.rules[r[0]]?'on':''}" data-toggle-rule="${r[0]}" aria-label="Toggle ${r[1]}"></button><div><strong>${r[1]}</strong><p>${r[2]}</p></div>${badge(state.rules[r[0]]?'Required':'Disabled',state.rules[r[0]]?'green':'')}</div>`).join('')}</div></section>
 <section class="card"><div class="card-header"><div><h3>Preference weights</h3><p>10 = most important during optimization.</p></div>${badge('Soft constraints','blue')}</div><div class="card-body rule-list">${soft.map(r=>`<div class="rule-row" style="grid-template-columns:1fr 150px"><div><strong>${r[1]}</strong><p>Weighted preference; may be relaxed if needed.</p></div><div class="range-wrap"><input type="range" min="0" max="10" value="${state.rules[r[0]]}" data-rule-range="${r[0]}"><span class="range-value">${state.rules[r[0]]}</span></div></div>`).join('')}</div></section></div>
 <div class="callout warning section-gap"><span>⚑</span><div><strong>Overrides are explicit and narrow</strong><p>Doubleheaders, locked-game changes, and other exceptions apply only to a selected game/team/date and are recorded in the local audit summary. Safety and field-eligibility rules are not automatically relaxed.</p></div></div>`;
}

function formatTime(v){ if(!v)return''; const [h,m]=v.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; }
function renderSchedule(){
 const has=state.schedule.length;
 const placed=state.schedule.length, expected=gameTotal();
 return `${heading('Build & manage','Generate & review','Create a complete regular-season draft, then inspect fairness, field usage, rule outcomes, and unresolved games.',`<button class="btn danger" data-action="open-hard-reset">Reset schedule</button><button class="btn secondary" data-action="generate">↻ ${has?'Regenerate':'Generate draft'}</button>${has?'<button class="btn secondary" data-go="rainouts">☂ Simulate rainout</button><button class="btn blue" data-action="approve">Approve draft</button>':''}`)}
 ${!has?`<section class="card empty-state"><div class="empty-art">▦</div><h2>No draft generated yet</h2><p>The local generator will create double-round-robin matchups and assign valid dates, compatible fields, and start times using your current configuration.</p><button class="btn blue" data-action="generate">Generate ${gameTotal()}-game draft →</button></section>`:renderScheduleContent(placed,expected)}`;
}

function renderScheduleContent(placed,expected){
 const filtered=state.scheduleFilter==='all'?state.schedule:state.schedule.filter(g=>g.divisionId===state.scheduleFilter);
 const adjustments=state.schedule.filter(game=>game.attention);
 const imbalances=state.divisions.flatMap(division=>division.teams.map(team=>{const games=state.schedule.filter(game=>game.homeId===team.id||game.awayId===team.id),home=games.filter(game=>game.homeId===team.id).length;return Math.abs(home-(games.length-home));})),maxImbalance=Math.max(0,...imbalances),balanceValid=maxImbalance<=2;
 return `<div class="grid four"><div class="card metric"><div class="metric-label">Games placed</div><div class="metric-value">${placed}<span style="font-size:15px;color:var(--muted)"> / ${expected}</span></div><div class="metric-note ${placed===expected?'good':''}">${placed===expected?'✓ Complete matchup set':`${expected-placed} still need placement`}</div></div><div class="card metric"><div class="metric-label">Review adjustments</div><div class="metric-value">${adjustments.length}</div><div class="metric-note ${adjustments.length?'':'good'}">${adjustments.length?'Require administrator attention':'✓ No exceptions needed'}</div></div><div class="card metric"><div class="metric-label">Max home / away difference</div><div class="metric-value">${maxImbalance}</div><div class="metric-note ${balanceValid?'good':''}">${balanceValid?'✓ Within hard limit':'Hard limit exceeded'}</div></div><div class="card metric"><div class="metric-label">Official coverage</div><div class="metric-value" style="font-size:24px">Unverified</div><div class="metric-note">${state.schedule.filter(g=>g.officialRequired).length} games require staffing</div></div></div>
 ${state.unassigned.length?renderUnassignedDiagnostics():''}
 ${adjustments.length?renderAdjustmentDiagnostics(adjustments):''}
 <section class="card section-gap"><div class="card-header"><div><h3>Draft v${state.version}</h3><p>Generated ${new Date(state.generatedAt).toLocaleString()} · deterministic local planning copy</p></div>${badge(state.status,state.status==='approved'?'green':'blue')}</div><div class="card-body">
  <div class="schedule-toolbar"><div class="filter-group"><select id="schedule-filter"><option value="all">All divisions</option>${state.divisions.map(d=>`<option value="${d.id}" ${state.scheduleFilter===d.id?'selected':''}>${d.name}</option>`).join('')}</select><select id="schedule-view"><option value="calendar">Calendar view</option><option value="list" ${state.scheduleView==='list'?'selected':''}>List view</option><option value="team">Team summary</option></select></div><div class="inline-stat"><span><strong>${filtered.length}</strong> shown</span><span><strong>${new Set(filtered.map(g=>g.fieldId)).size}</strong> fields used</span></div></div>
  ${state.scheduleView==='list'?renderGameTable(filtered):state.scheduleView==='team'?renderTeamSummary(filtered):renderCalendar(filtered)}
 </div></section>`;
}

function renderAdjustmentDiagnostics(adjustments){
 const fieldExceptions=adjustments.filter(game=>game.fieldException).length;
 const dayExceptions=adjustments.filter(game=>game.dayException).length;
 const groups=new Map();
 for(const game of adjustments){
  const stored=game.adjustment.batch,legacyRainout=game.adjustment.type==='Rainout makeup';
  const batch=stored||{id:legacyRainout?'legacy-rainout':'legacy-schedule',label:legacyRainout?'Earlier rainout makeup adjustments':`Draft v${state.version} · Schedule recovery`,createdAt:state.generatedAt||'',kind:legacyRainout?'rainout':'schedule'};
  if(!groups.has(batch.id))groups.set(batch.id,{...batch,games:[]});
  groups.get(batch.id).games.push(game);
 }
 const drafts=[...groups.values()].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')||(b.kind==='rainout'?1:0)-(a.kind==='rainout'?1:0));
 const rows=games=>games.map(game=>`<tr><td><strong>${game.id}</strong><div style="margin-top:5px">${badge(game.adjustment.type,game.fieldException?'red':'amber')}</div><button class="text-link adjustment-detail-link" data-adjustment-detail="${game.id}">Why this adjustment?</button></td><td><strong>${esc(game.divisionName)}</strong><div class="muted" style="margin-top:4px">${esc(game.awayName)} at ${esc(game.homeName)}</div></td><td><strong>${esc(weekdayLabel(game.adjustment.selected))}</strong><div style="margin-top:5px">${esc(game.adjustment.summary)}</div><div class="muted" style="font-size:10px;margin-top:4px">Initial blocker: ${esc(game.adjustment.originalReason)}</div></td><td>${game.adjustment.alternatives.length?game.adjustment.alternatives.map((option,index)=>`<div style="margin-bottom:5px"><strong>${index+1}.</strong> ${esc(weekdayLabel(option))}</div>`).join(''):'No additional conflict-free option found'}</td></tr>`).join('');
 return `<div class="callout warning section-gap"><span>⚑</span><div><strong>${adjustments.length} games require attention across ${drafts.length} adjustment draft${drafts.length===1?'':'s'}</strong><p>${fieldExceptions} use nonstandard fields and ${dayExceptions} use nonstandard days. New drafts are shown first; earlier drafts stay collapsed below them.</p></div></div>
 <section class="card section-gap diagnostic-card"><div class="card-header"><div><h3>Games requiring extra attention</h3><p>Recommended placements are included in the schedule. Expand a draft to review its decisions and alternatives.</p></div>${badge(`${drafts.length} draft${drafts.length===1?'':'s'}`,'amber')}</div><div class="adjustment-stack">${drafts.map((draft,index)=>`<details class="adjustment-draft" ${index===0?'open':''}><summary><span><strong>${esc(draft.label)}</strong><small>${draft.createdAt?`Created ${new Date(draft.createdAt).toLocaleString()} · `:''}${draft.games.length} adjusted game${draft.games.length===1?'':'s'}</small></span>${badge(index===0?'Newest':'Earlier',index===0?'blue':'')}</summary><div class="table-wrap"><table><thead><tr><th>Game</th><th>League & teams</th><th>Selected adjustment</th><th>Other options</th></tr></thead><tbody>${rows(draft.games)}</tbody></table></div></details>`).join('')}</div></section>`;
}

function renderUnassignedDiagnostics(){
 const groups=new Map();
 for(const game of state.unassigned){
  if(!groups.has(game.divisionId))groups.set(game.divisionId,{name:game.divisionName,games:0,teams:new Set()});
  const group=groups.get(game.divisionId);group.games++;group.teams.add(game.homeName);group.teams.add(game.awayName);
 }
 return `<div class="callout danger section-gap"><span>!</span><div><strong>${state.unassigned.length} games could not be assigned across ${groups.size} league${groups.size===1?'':'s'}</strong><p>Every affected game and team is listed below. Placed games remain valid; no hard rules were silently relaxed.</p></div></div>
 <section class="card section-gap diagnostic-card"><div class="card-header"><div><h3>Unresolved game diagnostics</h3><p>Use the league summary to identify the constrained rules, then edit the affected division or fields and regenerate.</p></div>${badge(`${state.unassigned.length} unresolved`,'red')}</div><div class="card-body"><div class="grid ${groups.size>1?'two':''}">${[...groups.values()].map(group=>`<div class="impact-row"><div><strong>${esc(group.name)}</strong><p>${group.games} game${group.games===1?'':'s'} · ${group.teams.size} affected teams</p><p>${[...group.teams].map(esc).join(', ')}</p></div>${badge(`${group.games} blocked`,'red')}</div>`).join('')}</div></div><div class="table-wrap"><table><thead><tr><th>Game</th><th>League</th><th>Affected teams</th><th>Why it failed</th></tr></thead><tbody>${state.unassigned.map(game=>`<tr><td><strong>${game.id}</strong></td><td>${esc(game.divisionName)}</td><td><strong>${esc(game.awayName)}</strong> <span class="muted">at</span> <strong>${esc(game.homeName)}</strong></td><td><span class="badge red">Unassigned</span><div style="margin-top:6px">${esc(game.reason)}</div><div class="muted" style="font-size:10px;margin-top:4px">${esc(game.details||'')}</div></td></tr>`).join('')}</tbody></table></div></section>`;
}

function renderGameTable(games){ return `<div class="table-wrap"><table><thead><tr><th>Game</th><th>Date & time</th><th>Matchup</th><th>Field</th><th>Coverage</th><th>Status</th></tr></thead><tbody>${games.slice(0,160).map(g=>`<tr class="${g.attention?'attention-row':''}"><td>${g.id}${g.attention?'<div style="margin-top:4px">'+badge('Review','amber')+'</div>':''}</td><td><strong>${prettyDate(g.date,{weekday:'short',month:'short',day:'numeric'})}</strong><div class="muted">${formatTime(g.time)}</div></td><td>${g.awayName} <span class="muted">at</span> ${g.homeName}<div class="muted" style="font-size:10px">${g.divisionName}</div></td><td>${g.fieldName}${g.fieldException?'<div style="margin-top:4px">'+badge('Field exception','red')+'</div>':''}</td><td>${g.officialRequired?badge('Unverified','amber'):badge('Volunteer','')}</td><td>${g.attention?badge('Needs review','amber'):badge(g.status,g.status==='postponed'?'red':'green')}</td></tr>`).join('')}</tbody></table>${games.length>160?`<div class="muted" style="padding:14px">Showing first 160 of ${games.length} games. Use a division filter to narrow the list.</div>`:''}</div>`; }

function renderTeamSummary(games){
 const rows=[]; state.divisions.forEach(d=>d.teams.forEach(t=>{ const mine=games.filter(g=>g.homeId===t.id||g.awayId===t.id); if(mine.length) rows.push({divisionId:d.id,teamId:t.id,division:d.name,name:t.name,games:mine.length,home:mine.filter(g=>g.homeId===t.id).length,away:mine.filter(g=>g.awayId===t.id).length,weekends:mine.filter(g=>['Sat','Sun'].includes(DAY_NAMES[dateObj(g.date).getDay()])).length,attention:mine.filter(g=>g.attention).length}); }));
 return `<div class="table-wrap"><table><thead><tr><th>Team</th><th>Division</th><th>Games</th><th>Home</th><th>Away</th><th>Weekend</th><th>Balance</th><th>Review</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr class="team-summary-row" data-team-detail="${r.teamId}" data-division-id="${r.divisionId}" tabindex="0"><td><strong>${r.name}</strong></td><td>${r.division}</td><td>${r.games}</td><td>${r.home}</td><td>${r.away}</td><td>${r.weekends}</td><td>${Math.abs(r.home-r.away)<=2?badge(`${r.home}–${r.away}`,'green'):badge(`${r.home}–${r.away}`,'red')}</td><td>${r.attention?badge(`${r.attention} flagged`,'amber'):badge('Clear','green')}</td><td><button class="text-link" data-team-detail="${r.teamId}" data-division-id="${r.divisionId}">View schedule →</button></td></tr>`).join('')}</tbody></table></div>`;
}

function renderCalendar(games){
 const start=dateObj(state.season.start); start.setDate(start.getDate()-start.getDay());
 const weekCount=Math.ceil((dateObj(state.season.end)-start)/86400000/7)+1;
 const weeks=[]; for(let w=0;w<weekCount;w++){ const days=[]; for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+w*7+i);days.push(dateISO(d));} weeks.push(days); }
 return `<div class="table-wrap"><div class="calendar"><div class="cal-head">Week</div>${DAY_NAMES.map(d=>`<div class="cal-head">${d}</div>`).join('')}${weeks.map((week,wi)=>`<div class="cal-cell cal-week">WEEK ${wi+1}</div>${week.map(date=>{ const dayGames=games.filter(g=>g.date===date).sort((a,b)=>a.time.localeCompare(b.time)); return `<div class="cal-cell"><span class="cal-date">${prettyDate(date)}</span>${dayGames.slice(0,3).map(g=>`<div class="game-chip ${g.sport.toLowerCase()} ${g.attention?'attention':''}" title="${g.awayName} at ${g.homeName} · ${g.fieldName}${g.attention?' · Needs review':''}"><strong>${g.attention?'⚑ ':''}${formatTime(g.time)} · ${g.divisionName}</strong>${g.awayName} @ ${g.homeName}</div>`).join('')}${dayGames.length>3?`<div class="more-games">+ ${dayGames.length-3} more games</div>`:''}</div>`;}).join('')}`).join('')}</div></div>`;
}

function renderRainouts(){
 const gameDates=[...new Set(state.schedule.filter(game=>game.status==='scheduled').map(game=>game.date))].sort();
 if(!state.rainoutDate||!gameDates.includes(state.rainoutDate))state.rainoutDate=gameDates[0]||null;
 const candidates=state.schedule.filter(game=>game.status==='scheduled'&&game.date===state.rainoutDate),dayFields=[...new Map(candidates.map(game=>[game.fieldId,{id:game.fieldId,name:game.fieldName,count:candidates.filter(item=>item.fieldId===game.fieldId).length}])).values()];
 return `${heading('Build & manage','Rainout workbench','Choose a game date, cancel individual games, then optionally close an affected field before drafting weekend makeups.',`<button class="btn blue" data-action="find-repairs" ${state.selectedRainouts.length?'':'disabled'}>Draft makeup assignments</button>`)}
 ${!state.schedule.length?`<section class="card empty-state"><div class="empty-art">☂</div><h2>A draft is needed first</h2><p>Generate a schedule, or import an existing one, before selecting games to postpone.</p><button class="btn blue" data-go="schedule">Go to schedule generator</button></section>`:
 `<div class="grid"><section class="card"><div class="card-header"><div><p class="eyebrow">Step 1</p><h3>Choose the affected date</h3><p>Only dates containing scheduled games can move to the next step.</p></div><div class="field-group" style="min-width:220px"><label for="rainout-date">Game date</label><input id="rainout-date" type="date" min="${state.season.start}" max="${state.season.end}" list="scheduled-game-dates" value="${state.rainoutDate||''}"><datalist id="scheduled-game-dates">${gameDates.map(date=>`<option value="${date}">${state.schedule.filter(game=>game.date===date&&game.status==='scheduled').length} games</option>`).join('')}</datalist></div></div></section>
 <div class="split-layout"><section class="card"><div class="card-header"><div><p class="eyebrow">Step 2</p><h3>Select canceled games</h3><p>${candidates.length} games on ${prettyDate(state.rainoutDate,{weekday:'long',month:'long',day:'numeric'})} · ${state.selectedRainouts.length} selected</p></div><div class="button-row"><button class="text-link" data-action="select-all-rainouts" ${!candidates.length||candidates.every(game=>state.selectedRainouts.includes(game.id))?'disabled':''}>Select all ${candidates.length||''}</button><button class="text-link" data-action="clear-rainouts" ${state.selectedRainouts.length?'':'disabled'}>Clear selections</button></div></div><div class="table-wrap" style="max-height:570px"><table><thead><tr><th></th><th>Game</th><th>Time</th><th>Matchup</th><th>Field</th></tr></thead><tbody>${candidates.map(g=>`<tr><td><input type="checkbox" data-rainout="${g.id}" ${state.selectedRainouts.includes(g.id)?'checked':''}></td><td>${g.id}</td><td><strong>${formatTime(g.time)}</strong></td><td>${g.awayName} at ${g.homeName}<div class="muted" style="font-size:10px">${g.divisionName}</div></td><td>${g.fieldName}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">No scheduled games on this date.</td></tr>'}</tbody></table></div></section>
 <aside class="grid"><div class="card pad"><p class="eyebrow">Step 3 · Optional</p><h3>Close affected fields</h3><p class="muted">Closing a field selects every game scheduled there on this date.</p><div class="divider"></div><div class="impact-list">${dayFields.map(field=>`<label class="impact-row"><span><strong>${esc(field.name)}</strong><p>${field.count} scheduled game${field.count===1?'':'s'}</p></span><input type="checkbox" data-rainout-field="${field.id}" ${state.rainoutClosedFields.includes(field.id)?'checked':''}></label>`).join('')||'<p class="muted">No fields in use.</p>'}</div></div>
 <div class="card pad"><p class="eyebrow">Makeup policy</p><h3>Weekend first</h3><div class="divider"></div><div class="impact-list"><div class="checkbox-row"><input type="checkbox" checked disabled><span>Saturday: 10 AM, 1 PM, 4 PM</span></div><div class="checkbox-row"><input type="checkbox" checked disabled><span>Sunday: 1 PM, 4 PM</span></div><div class="checkbox-row"><input type="checkbox" checked disabled><span>Keep unaffected games locked</span></div><div class="checkbox-row"><input type="checkbox" checked disabled><span>Weekdays only as marked fallback</span></div></div></div></aside></div>
 ${state.repairs.length||state.repairFailures.length?`<section class="card"><div class="card-header"><div><p class="eyebrow">Draft proposal</p><h3>${state.repairs.length} of ${state.selectedRainouts.length} games reassigned</h3><p>Assignments were solved together against the current schedule.</p></div>${state.repairFailures.length?badge(`${state.repairFailures.length} unresolved`,'red'):badge('Complete','green')}</div><div class="table-wrap"><table><thead><tr><th>Game</th><th>Original</th><th>Draft makeup</th><th>Policy</th><th>Other options</th></tr></thead><tbody>${state.repairs.map(r=>`<tr><td><strong>${r.gameId}</strong><div class="muted">${esc(r.matchup)}</div></td><td>${gameDate(r.oldDate)}<div class="muted">${formatTime(r.oldTime)} · ${r.oldField}</div></td><td><strong>${gameDate(r.newDate)}</strong><div>${formatTime(r.newTime)} · ${r.fieldName}</div></td><td>${badge(r.weekend?'Weekend makeup':'Weekday fallback',r.weekend?'green':'amber')}</td><td>${r.alternatives.length?r.alternatives.map(option=>`<div class="muted" style="margin-bottom:4px">${esc(weekdayLabel(option))}</div>`).join(''):'—'}</td></tr>`).join('')}${state.repairFailures.map(f=>`<tr class="attention-row"><td><strong>${f.gameId}</strong><div class="muted">${esc(f.matchup)}</div></td><td colspan="4">${badge('Unresolved','red')} <strong style="margin-left:6px">${esc(f.divisionName)}</strong><div class="muted" style="margin-top:4px">${esc(f.reason)}</div></td></tr>`).join('')}</tbody></table></div><div class="card-body" style="display:flex;justify-content:flex-end"><button class="btn blue" data-action="apply-repairs" ${state.repairFailures.length?'disabled':''}>Apply makeup draft</button></div></section>`:''}
 </div>`}`;
}

function renderExport(){
 const approved=state.status==='approved';
 return `${heading('Build & manage','Approval & export','Review the planning version, record approval, and download an administrator-friendly CSV for manual entry.',approved?`<button class="btn blue" data-action="download-csv">Download schedule CSV</button>`:'')}
 <div class="status-timeline"><div class="status-step done"><span>✓</span>Configured</div><div class="status-step ${state.schedule.length?'done':''}"><span>${state.schedule.length?'✓':'2'}</span>Generated</div><div class="status-step ${approved?'done':'current'}"><span>${approved?'✓':'3'}</span>Approved</div><div class="status-step"><span>4</span>Externally confirmed</div></div>
 <div class="grid two"><section class="card"><div class="card-header"><div><h3>Draft v${state.version||'—'} summary</h3><p>This approval applies only to the local planning copy.</p></div>${badge(state.schedule.length?state.status:'No draft',approved?'green':'amber')}</div><div class="card-body"><div class="form-grid"><div><span class="metric-label">Games</span><div class="metric-value">${state.schedule.length}</div></div><div><span class="metric-label">Unassigned</span><div class="metric-value">${state.unassigned.length}</div></div><div><span class="metric-label">Postponed</span><div class="metric-value">${state.postponed.length}</div></div><div><span class="metric-label">Needs review</span><div class="metric-value">${state.schedule.filter(game=>game.attention).length}</div></div></div><div class="divider"></div><div class="callout warning"><span>!</span><div><strong>Manual reconciliation required</strong><p>The current scheduling service is the source of truth. Downloading a file does not publish or confirm any game.</p></div></div></div></section>
 <section class="card"><div class="card-header"><div><h3>Approval record</h3><p>Stored in this browser for demo purposes.</p></div></div><div class="card-body"><div class="form-grid">${input('Approver','approver',state.approver||'League Administrator')}${input('Approval date','approvalDate',state.approvalDate||new Date().toISOString().slice(0,10),'date')}</div><div class="field-group section-gap"><label>Review notes</label><textarea id="approval-notes" rows="4" placeholder="Add decisions, exceptions, or items to verify...">${esc(state.approvalNotes||'Verify umpire availability and reconcile against the current service before manual publication.')}</textarea></div><button class="btn blue section-gap" data-action="approve" ${state.schedule.length?'':'disabled'}>${approved?'Update approval record':'Approve local draft'}</button></div></section></div>
 <section class="card section-gap"><div class="card-header"><div><h3>Export package</h3><p>CSV keeps stable game IDs, dates, times, fields, statuses, and coverage notes.</p></div></div><div class="card-body"><div class="impact-list"><div class="impact-row"><div><strong>Full schedule CSV</strong><p>${state.schedule.length} scheduled records · ready for administrator review</p></div><button class="btn secondary small" data-action="download-csv" ${state.schedule.length?'':'disabled'}>Download</button></div><div class="impact-row"><div><strong>Change list CSV</strong><p>${state.postponed.length} repair records with previous and proposed slots</p></div><button class="btn secondary small" data-action="download-changes" ${state.postponed.length?'':'disabled'}>Download</button></div></div></div></section>`;
}

function roundRobin(teamIds){
 let arr=[...teamIds]; if(arr.length%2)arr.push(null); const n=arr.length, rounds=[];
 for(let r=0;r<n-1;r++){ const pairs=[]; for(let i=0;i<n/2;i++){ const a=arr[i],b=arr[n-1-i]; if(a&&b)pairs.push(r%2?[b,a]:[a,b]); } rounds.push(pairs); arr=[arr[0],arr[n-1],...arr.slice(1,n-1)]; }
 return [...rounds,...rounds.map(round=>round.map(([h,a])=>[a,h]))];
}
function matchupRounds(teamIds,gamesPerTeam){
 const source=roundRobin(teamIds),counts=new Map(teamIds.map(id=>[id,0])),target=teamIds.length*gamesPerTeam/2,result=[];
 let placed=0,index=0,stalled=0;
 while(placed<target&&stalled<source.length){
  const sourceRound=source[index%source.length],round=[];
  for(const [home,away] of sourceRound){
   if(counts.get(home)>=gamesPerTeam||counts.get(away)>=gamesPerTeam)continue;
   round.push([home,away]);counts.set(home,counts.get(home)+1);counts.set(away,counts.get(away)+1);placed++;
  }
  if(round.length){result.push(round);stalled=0;}else stalled++;
  index++;
 }
 return result;
}
function balanceHomeAway(games){
 for(const division of state.divisions.filter(item=>item.enabled!==false)){
  const divisionGames=games.filter(game=>game.divisionId===division.id),homeCounts=new Map(division.teams.map(team=>[team.id,divisionGames.filter(game=>game.homeId===team.id).length]));
  const totalCounts=new Map(division.teams.map(team=>[team.id,divisionGames.filter(game=>game.homeId===team.id||game.awayId===team.id).length]));
  const minHomes=id=>Math.ceil((totalCounts.get(id)-2)/2),maxHomes=id=>Math.floor((totalCounts.get(id)+2)/2);
  const flip=game=>{[game.homeId,game.awayId]=[game.awayId,game.homeId];[game.homeName,game.awayName]=[game.awayName,game.homeName];homeCounts.set(game.homeId,homeCounts.get(game.homeId)+1);homeCounts.set(game.awayId,homeCounts.get(game.awayId)-1);};
  let changed=true,guard=0;
  while(changed&&guard<divisionGames.length*2){
   changed=false;guard++;
   for(const team of division.teams){
    if(homeCounts.get(team.id)>=minHomes(team.id))continue;
    const candidate=divisionGames.filter(game=>game.awayId===team.id&&homeCounts.get(game.homeId)>minHomes(game.homeId)).sort((a,b)=>homeCounts.get(b.homeId)-homeCounts.get(a.homeId))[0];
    if(candidate){flip(candidate);changed=true;}
   }
   for(const team of division.teams){
    if(homeCounts.get(team.id)<=maxHomes(team.id))continue;
    const candidate=divisionGames.filter(game=>game.homeId===team.id&&homeCounts.get(game.awayId)<maxHomes(game.awayId)).sort((a,b)=>homeCounts.get(a.awayId)-homeCounts.get(b.awayId))[0];
    if(candidate){flip(candidate);changed=true;}
   }
  }
 }
}
function minutes(t){ const [h,m]=t.split(':').map(Number); return h*60+m; }
function timeString(n){ return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`; }
function daysApart(a,b){ return Math.abs(Math.round((dateObj(a)-dateObj(b))/86400000)); }
function roundDates(div,roundCount){
 const weeks=new Map();
 const rangeStart=div.start||state.season.start,rangeEnd=div.end||state.season.end;
 for(let iso=rangeStart;iso<=rangeEnd;iso=addDays(iso,1)){
  const d=dateObj(iso),day=DAY_NAMES[d.getDay()];
  if(state.season.holidays.includes(iso)||!div.days.includes(day))continue;
  const sunday=new Date(d);sunday.setDate(d.getDate()-d.getDay());const key=dateISO(sunday);
  if(!weeks.has(key))weeks.set(key,[]);weeks.get(key).push(iso);
 }
 const divisionIndex=Math.max(0,state.divisions.findIndex(d=>d.id===div.id));
 const weekDates=[...weeks.values()],counts=weekDates.map(()=>0);
 let remaining=roundCount;
 if(remaining>=weekDates.length){counts.fill(1);remaining-=weekDates.length;}
 else {
  for(let i=0;i<remaining;i++)counts[Math.floor(i*weekDates.length/remaining)]=1;
  remaining=0;
 }
 let cursor=divisionIndex%Math.max(1,weekDates.length),guard=0;
 while(remaining>0&&guard<weekDates.length*3){
  const index=cursor%weekDates.length;
  if(counts[index]<Math.min(2,weekDates[index].length)){counts[index]++;remaining--;}
  cursor++;guard++;
 }
 return weekDates.flatMap((dates,weekIndex)=>{
  const offset=(divisionIndex+weekIndex)%dates.length;
  const ordered=[...dates.slice(offset),...dates.slice(0,offset)];
  return ordered.slice(0,counts[weekIndex]).map(preferred=>[preferred,...ordered.filter(date=>date!==preferred)]);
 });
}

function rescueUnassignedGames(games,failures,bookings,batch){
 const unresolved=[];
 for(const failure of failures){
  const div=state.divisions.find(item=>item.id===failure.divisionId),home=div.teams.find(team=>team.id===failure.homeId),away=div.teams.find(team=>team.id===failure.awayId);
  const assignedFields=state.fields.filter(field=>!field.closed&&field.divisions.includes(div.id));
  const assignedComplexes=new Set(assignedFields.map(field=>field.complex));
  const defaultConfiguredTime=Object.values(div.startTimes||{}).flat()[0]||(div.sport==='Tee-ball'?state.season.weekendStart:state.season.weekdayStart);
  const candidates=[];
  for(let date=div.start;date<=div.end;date=addDays(date,1)){
   if(state.season.holidays.includes(date))continue;
   const day=DAY_NAMES[dateObj(date).getDay()];
   const dayException=!div.days.includes(day);
   if(dayException&&day==='Sun')continue;
   if(!dayException&&(!(home.availableDays||div.days).includes(day)||!(away.availableDays||div.days).includes(day)))continue;
   if(games.some(game=>game.date===date&&(game.homeId===home.id||game.awayId===home.id||game.homeId===away.id||game.awayId===away.id)))continue;
   const weekday=!['Sat','Sun'].includes(day),times=div.startTimes?.[day]||[weekday?defaultConfiguredTime:state.season.weekendStart];
   for(const time of times){
    const start=minutes(time),end=start+div.duration;
    if(end+state.season.safetyBuffer>minutes(state.season.daylight))continue;
    for(const field of state.fields.filter(item=>!item.closed)){
     if(start<minutes(weekday?field.weekdayOpen:field.weekendOpen)||end+state.season.safetyBuffer>minutes(field.close))continue;
     if(bookings.some(booking=>booking.fieldId===field.id&&booking.date===date&&start<booking.end+field.turnover&&end+field.turnover>booking.start))continue;
     const assigned=field.divisions.includes(div.id),sameComplex=assignedComplexes.has(field.complex),targetDate=(failure.attemptedDates||[]).includes(date);
     const existingDates=games.filter(game=>game.homeId===home.id||game.awayId===home.id||game.homeId===away.id||game.awayId===away.id).map(game=>game.date);
     const nearest=existingDates.length?Math.min(...existingDates.map(existing=>daysApart(existing,date))):99;
     const score=(assigned?0:100)+(dayException?200:0)+(targetDate?0:20)+(assigned||sameComplex?0:15)+(nearest===1?50:nearest===2?8:0);
     candidates.push({date,time,field,assigned,sameComplex,targetDate,dayException,score});
    }
   }
  }
  candidates.sort((a,b)=>a.score-b.score||a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  const selected=candidates[0];
  if(!selected){unresolved.push({...failure,details:`${failure.details} · Recovery pass found no conflict-free alternative`});continue;}
  bookings.push({fieldId:selected.field.id,date:selected.date,start:minutes(selected.time),end:minutes(selected.time)+div.duration});
  const adjustmentType=selected.dayException&&!selected.assigned?'Day and field exception':selected.dayException?'Day-of-week exception':selected.assigned?'Date-window adjustment':'Field assignment exception';
  const optionLabel=option=>`${gameDate(option.date)} at ${formatTime(option.time)} · ${option.field.name}${option.dayException?' (day exception)':''}${option.assigned?'':' (field exception)'}`;
  const notes=[];if(selected.dayException)notes.push(`${DAY_NAMES[dateObj(selected.date).getDay()]} is outside the league’s normal days`);if(!selected.assigned)notes.push(`${selected.field.name} is not normally assigned to this league; verify physical compatibility`);if(!notes.length)notes.push('Moved to another valid date within the league window');
  const configuredSlots=div.days.flatMap(day=>(div.startTimes?.[day]||[]).map(time=>`${day} ${formatTime(time)}`));
  games.push({id:failure.id,divisionId:div.id,divisionName:div.name,sport:div.sport,homeId:home.id,awayId:away.id,homeName:home.name,awayName:away.name,date:selected.date,time:selected.time,duration:div.duration,fieldId:selected.field.id,fieldName:selected.field.name,status:'scheduled',locked:false,officialRequired:div.officialCount>0,officialQualification:div.official,coverage:div.officialCount>0?'unverified':'volunteer',attention:true,fieldException:!selected.assigned,dayException:selected.dayException,adjustment:{type:adjustmentType,originalReason:failure.reason,summary:`${notes.join('; ')}.`,selected:optionLabel(selected),alternatives:candidates.slice(1,4).map(optionLabel),batch:clone(batch),originalPlan:{attemptedDates:[...(failure.attemptedDates||[])],eligibleDays:[...div.days],configuredSlots,assignedFields:assignedFields.map(field=>field.name),details:failure.details},resolution:{searchSteps:['Checked the matchup against its normal league dates, configured start times, and assigned fields.','Built a second set of conflict-free candidates across the league window.','Ranked normal fields and normal league days first, then allowed narrow, visibly marked exceptions.'],preserved:['No team doubleheaders','No field overlap or turnover conflict','Operating hours and daylight safety buffer','League date window'],whySelected:`This was the highest-ranked conflict-free option${selected.assigned?' on a normally assigned field':' after compatible normal-field capacity was exhausted'}${selected.dayException?' and required a day-of-week exception':''}.`}}});
 }
 return unresolved;
}

function generateSchedule(){
 const games=[],unassigned=[],bookings=[]; let sequence=1;
 const ordered=state.divisions.filter(d=>d.enabled!==false).sort((a,b)=>a.official.localeCompare(b.official)||fieldCoverage(a)-fieldCoverage(b));
 for(const div of ordered){
  const rounds=matchupRounds(div.teams.map(t=>t.id),div.gamesPerTeam);
  const playableDateOptions=roundDates(div,rounds.length);
  const allNormalDates=[];
  for(let date=div.start;date<=div.end;date=addDays(date,1)){
   const day=DAY_NAMES[dateObj(date).getDay()];
   if(!state.season.holidays.includes(date)&&div.days.includes(day))allNormalDates.push(date);
  }
  rounds.forEach((pairs,ri)=>{
   const preferredDates=playableDateOptions[ri]||[];
   const dateOptions=[...preferredDates,...allNormalDates.filter(date=>!preferredDates.includes(date))];
   pairs.forEach(([homeId,awayId])=>{
    const home=div.teams.find(t=>t.id===homeId),away=div.teams.find(t=>t.id===awayId); let placed=null,evaluatedSlots=0,teamConflictSlots=0,openFieldSlots=0;
    const compatibleFields=state.fields.filter(field=>!field.closed&&field.divisions.includes(div.id));
    const relevantGames=games.filter(g=>g.homeId===homeId||g.awayId===homeId||g.homeId===awayId||g.awayId===awayId);
    const saturdayTarget=Math.max(2,Math.round(div.gamesPerTeam*.3));
    const homeSaturdays=games.filter(g=>(g.homeId===homeId||g.awayId===homeId)&&DAY_NAMES[dateObj(g.date).getDay()]==='Sat').length;
    const awaySaturdays=games.filter(g=>(g.homeId===awayId||g.awayId===awayId)&&DAY_NAMES[dateObj(g.date).getDay()]==='Sat').length;
    const rankedDates=dateOptions.filter(Boolean).filter(date=>{const day=DAY_NAMES[dateObj(date).getDay()];return (home.availableDays||div.days).includes(day)&&(away.availableDays||div.days).includes(day);}).sort((a,b)=>{
     const score=date=>{const gaps=relevantGames.map(g=>daysApart(g.date,date));const nearest=gaps.length?Math.min(...gaps):99;const widestOption=Math.max(0,...dateOptions.map(option=>daysApart(option,date)));const isSaturday=DAY_NAMES[dateObj(date).getDay()]==='Sat';const saturdayScore=isSaturday?(homeSaturdays<saturdayTarget&&awaySaturdays<saturdayTarget?-3*state.rules.saturdayMix:60):0;return (nearest===1?1000:nearest===2?40:nearest===3?8:0)-widestOption*5+saturdayScore;};
     return score(a)-score(b);
    });
    for(const date of rankedDates){
     const day=DAY_NAMES[dateObj(date).getDay()];
     const weekday=dateObj(date).getDay()!==0&&dateObj(date).getDay()!==6;
     const latest=minutes(state.season.daylight)-Number(state.season.safetyBuffer)-div.duration;
     const dayTimes=div.startTimes?.[day]||[];
     const configuredTimes=dayTimes.filter(time=>minutes(time)<=latest);
     const fallbackTime=weekday?state.season.weekdayStart:state.season.weekendStart;
     const rawTimes=dayTimes.length?configuredTimes:[fallbackTime];
     if(!rawTimes.length)continue;
     const rotation=ri%rawTimes.length,timeOptions=[...rawTimes.slice(rotation),...rawTimes.slice(0,rotation)];
     for(const time of timeOptions){
      evaluatedSlots++;
      const teamBusy=games.some(g=>g.date===date&&(g.homeId===homeId||g.awayId===homeId||g.homeId===awayId||g.awayId===awayId));
      if(teamBusy&&state.rules.noDoubleheaders){teamConflictSlots++;continue;}
      const candidateStart=minutes(time),candidateEnd=candidateStart+div.duration;
      const windowFields=compatibleFields.filter(f=>candidateStart>=minutes(weekday?f.weekdayOpen:f.weekendOpen)&&candidateEnd+Number(state.season.safetyBuffer)<=minutes(f.close));
      if(windowFields.length)openFieldSlots++;
      const field=windowFields.find(f=>!bookings.some(b=>b.fieldId===f.id&&b.date===date&&candidateStart<b.end+f.turnover&&candidateEnd+f.turnover>b.start));
      if(field){ placed={date,time,field}; break; }
     }
     if(placed)break;
    }
    const id=`WYB-${String(sequence++).padStart(4,'0')}`;
    if(!placed){
     let reason='All assigned fields were occupied during eligible slots';
     if(!compatibleFields.length)reason='No available field is assigned to this league';
     else if(!rankedDates.length)reason='The two teams have no shared eligible date in this scheduling round';
     else if(!evaluatedSlots)reason='Configured start times do not fit the daylight cutoff and game duration';
     else if(teamConflictSlots===evaluatedSlots)reason='Every eligible slot would create a same-day team conflict';
     else if(!openFieldSlots)reason='Assigned fields are closed during every eligible start time';
     const details=`${rankedDates.length} eligible date${rankedDates.length===1?'':'s'} checked · ${compatibleFields.length} assigned field${compatibleFields.length===1?'':'s'} available`;
     unassigned.push({id,divisionId:div.id,divisionName:div.name,homeId,awayId,homeName:home.name,awayName:away.name,reason,details,attemptedDates:[...rankedDates]});return;
    }
    bookings.push({fieldId:placed.field.id,date:placed.date,start:minutes(placed.time),end:minutes(placed.time)+div.duration});
    games.push({id,divisionId:div.id,divisionName:div.name,sport:div.sport,homeId,awayId,homeName:home.name,awayName:away.name,date:placed.date,time:placed.time,duration:div.duration,fieldId:placed.field.id,fieldName:placed.field.name,status:'scheduled',locked:false,officialRequired:div.officialCount>0,officialQualification:div.official,coverage:div.officialCount>0?'unverified':'volunteer'});
   });
  });
 }
 const recoveryBatch={id:`schedule-v${state.version+1}`,label:`Draft v${state.version+1} · Schedule recovery`,createdAt:new Date().toISOString(),kind:'schedule'};
 const unresolved=rescueUnassignedGames(games,unassigned,bookings,recoveryBatch);
 balanceHomeAway(games);
 state.schedule=games.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)); state.unassigned=unresolved; state.version+=1; state.status='draft'; state.generatedAt=new Date().toISOString(); state.repairs=[];state.repairFailures=[];state.selectedRainouts=[];state.rainoutDate=null;state.rainoutClosedFields=[];save();
}

function findRepairs(){
 const selected=state.selectedRainouts.map(id=>state.schedule.find(g=>g.id===id)).filter(Boolean).sort((a,b)=>fieldCoverage(state.divisions.find(d=>d.id===a.divisionId))-fieldCoverage(state.divisions.find(d=>d.id===b.divisionId))),repairs=[],failures=[],proposedTeams=[];
 const reserved=state.schedule.filter(g=>!state.selectedRainouts.includes(g.id)).map(g=>({fieldId:g.fieldId,date:g.date,start:minutes(g.time),end:minutes(g.time)+(g.duration||90)}));
 const buildCandidates=(game,weekendOnly)=>{const div=state.divisions.find(d=>d.id===game.divisionId),options=[];for(let date=addDays(game.date,1);date<=addDays(state.season.end,14);date=addDays(date,1)){const day=DAY_NAMES[dateObj(date).getDay()],isWeekend=['Sat','Sun'].includes(day);if(weekendOnly&&!isWeekend)continue;if(!weekendOnly&&(isWeekend||!div.days.includes(day)))continue;const times=isWeekend?(day==='Sat'?['10:00','13:00','16:00']:['13:00','16:00']):(div.startTimes?.[day]||[]);for(const time of times){const start=minutes(time),end=start+game.duration;if(end+state.season.safetyBuffer>minutes(state.season.daylight))continue;const teamConflict=state.schedule.some(g=>!state.selectedRainouts.includes(g.id)&&g.date===date&&(g.homeId===game.homeId||g.awayId===game.homeId||g.homeId===game.awayId||g.awayId===game.awayId))||proposedTeams.some(slot=>slot.date===date&&(slot.teamIds.includes(game.homeId)||slot.teamIds.includes(game.awayId)));if(teamConflict)continue;for(const field of state.fields.filter(f=>!f.closed&&f.divisions.includes(div.id))){const weekday=!isWeekend;if(start<minutes(weekday?field.weekdayOpen:field.weekendOpen)||end+state.season.safetyBuffer>minutes(field.close))continue;if(reserved.some(b=>b.fieldId===field.id&&b.date===date&&start<b.end+field.turnover&&end+field.turnover>b.start))continue;const offset=daysApart(game.date,date),weekendScore=isWeekend?(Math.floor(offset/7)*100+(day==='Sun'?0:10)):10000;options.push({date,time,field,weekend:isWeekend,score:weekendScore+offset+(field.id===game.fieldId?-2:0)});}}}return options.sort((a,b)=>a.score-b.score||a.date.localeCompare(b.date)||a.time.localeCompare(b.time));};
 for(const game of selected){let candidates=buildCandidates(game,true);if(!candidates.length)candidates=buildCandidates(game,false);const chosen=candidates[0];if(!chosen){failures.push({gameId:game.id,divisionId:game.divisionId,divisionName:game.divisionName,homeId:game.homeId,homeName:game.homeName,awayId:game.awayId,awayName:game.awayName,matchup:`${game.awayName} at ${game.homeName}`,reason:'No conflict-free weekend or eligible weekday slot was available.'});continue;}reserved.push({fieldId:chosen.field.id,date:chosen.date,start:minutes(chosen.time),end:minutes(chosen.time)+game.duration});proposedTeams.push({date:chosen.date,teamIds:[game.homeId,game.awayId]});repairs.push({gameId:game.id,divisionId:game.divisionId,divisionName:game.divisionName,homeId:game.homeId,homeName:game.homeName,awayId:game.awayId,awayName:game.awayName,matchup:`${game.awayName} at ${game.homeName}`,oldDate:game.date,oldTime:game.time,oldField:game.fieldName,newDate:chosen.date,newTime:chosen.time,fieldId:chosen.field.id,fieldName:chosen.field.name,weekend:chosen.weekend,alternatives:candidates.slice(1,4).map(option=>`${prettyDate(option.date,{weekday:'short',month:'short',day:'numeric'})} · ${formatTime(option.time)} · ${option.field.name}`)});}
 state.repairs=repairs;state.repairFailures=failures;save();toast(`${repairs.length} makeup assignment${repairs.length===1?'':'s'} drafted`);render();
}

function modal(title,body,footer=''){ document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-header"><h2>${title}</h2><button class="close" data-close-modal>×</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</div></div>`; document.querySelector('[data-close-modal]').onclick=closeModal; document.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal();}); }
function closeModal(){ document.querySelector('#modal-root').innerHTML=''; }
function adjustmentDetailModal(gameId){
 const game=state.schedule.find(item=>item.id===gameId),adjustment=game?.adjustment;
 if(!game||!adjustment)return;
 const division=state.divisions.find(item=>item.id===game.divisionId),plan=adjustment.originalPlan||{},resolution=adjustment.resolution||{};
 const normalFields=plan.assignedFields?.length?plan.assignedFields:state.fields.filter(field=>!field.closed&&field.divisions.includes(game.divisionId)).map(field=>field.name);
 const normalSlots=plan.configuredSlots?.length?plan.configuredSlots:(division?.days||[]).flatMap(day=>(division?.startTimes?.[day]||[]).map(time=>`${day} ${formatTime(time)}`));
 const intendedDates=plan.attemptedDates?.length?plan.attemptedDates.map(gameDate):[];
 const prior=game.previous?`${gameDate(game.previous.date)} at ${formatTime(game.previous.time)} · ${game.previous.fieldName}`:null;
 const originalSummary=prior||`${game.awayName} at ${game.homeName} on a normal ${division?.name||game.divisionName} slot using an assigned field.`;
 const searchSteps=resolution.searchSteps||['Checked the normal league dates, configured start times, and assigned fields.','Removed options with a team conflict, field overlap, operating-hours issue, or daylight violation.','Ranked the remaining options by how closely they preserved the original league plan.'];
 const preserved=resolution.preserved||['No team doubleheaders','No field overlap or turnover conflict','Operating hours and daylight safety buffer','League date window'];
 modal(`Resolution details · ${game.id}`,`<div class="resolution-identity"><div><p class="eyebrow">${esc(game.divisionName)}</p><h3>${esc(game.awayName)} at ${esc(game.homeName)}</h3></div>${badge(adjustment.type,game.fieldException?'red':'amber')}</div>
 <div class="resolution-section"><span class="resolution-number">1</span><div><h3>Original intended plan</h3><p>${esc(originalSummary)}</p><div class="detail-grid"><div><span>Normal days and times</span><strong>${esc(normalSlots.join(' · ')||'Not configured')}</strong></div><div><span>Normally assigned fields</span><strong>${esc(normalFields.join(', ')||'None available')}</strong></div>${intendedDates.length?`<div class="wide"><span>Dates attempted in the original scheduling round</span><strong>${esc(intendedDates.join(' · '))}</strong></div>`:''}</div></div></div>
 <div class="resolution-section blocked"><span class="resolution-number">2</span><div><h3>Why it could not be placed</h3><p><strong>${esc(adjustment.originalReason)}</strong></p>${plan.details?`<p class="muted">${esc(plan.details)}</p>`:''}</div></div>
 <div class="resolution-section"><span class="resolution-number">3</span><div><h3>How the recovery search worked</h3><ol class="resolution-steps">${searchSteps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><p class="muted"><strong>Rules retained:</strong> ${esc(preserved.join(' · '))}</p></div></div>
 <div class="resolution-section resolved"><span class="resolution-number">4</span><div><h3>Why this resolution was selected</h3><p><strong>${esc(weekdayLabel(adjustment.selected))}</strong></p><p>${esc(resolution.whySelected||adjustment.summary)}</p>${adjustment.alternatives?.length?`<details><summary>Show ${adjustment.alternatives.length} other viable option${adjustment.alternatives.length===1?'':'s'}</summary><ol>${adjustment.alternatives.map(option=>`<li>${esc(weekdayLabel(option))}</li>`).join('')}</ol></details>`:'<p class="muted">No additional conflict-free option was found.</p>'}</div></div>`,`<button class="btn blue" data-close-modal>Done</button>`);
 document.querySelectorAll('[data-close-modal]').forEach(button=>button.onclick=closeModal);
}
function hardResetModal(){
 modal('Start with an empty schedule?',`<div class="callout"><span>↻</span><div><strong>Your setup will be retained.</strong><p>This clears the current draft, unresolved games, rainout work, adjustments, and approval state. Season settings, leagues, teams, fields, availability, and scheduling rules stay exactly as configured.</p></div></div>`,`<button class="btn secondary" data-close-modal>Cancel</button><button class="btn danger" id="confirm-hard-reset">Clear schedule</button>`);
 document.querySelectorAll('[data-close-modal]').forEach(button=>button.onclick=closeModal);
 document.querySelector('#confirm-hard-reset').onclick=()=>{
  state.schedule=[];state.unassigned=[];state.version=0;state.status='draft';state.generatedAt=null;state.postponed=[];state.repairs=[];state.repairFailures=[];state.selectedRainouts=[];state.rainoutDate=null;state.rainoutClosedFields=[];
  delete state.approver;delete state.approvalDate;delete state.approvalNotes;
  save('Schedule cleared');closeModal();render();toast('Schedule cleared; configuration retained');
 };
}
function teamScheduleModal(teamId,divisionId){
 const division=state.divisions.find(item=>item.id===divisionId),team=division?.teams.find(item=>item.id===teamId);
 if(!division||!team)return;
 const games=state.schedule.filter(game=>game.homeId===teamId||game.awayId===teamId).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
 const homeGames=games.filter(game=>game.homeId===teamId).length,weekendGames=games.filter(game=>['Sat','Sun'].includes(DAY_NAMES[dateObj(game.date).getDay()])).length,attentionGames=games.filter(game=>game.attention).length;
 const rows=games.map((game,index)=>{const home=game.homeId===teamId,opponent=home?game.awayName:game.homeName,rest=index?daysApart(games[index-1].date,game.date):null;return `<tr class="${game.attention?'attention-row':''}"><td><strong>${prettyDate(game.date,{weekday:'short',month:'short',day:'numeric'})}</strong><div class="muted">${formatTime(game.time)}</div></td><td>${badge(home?'Home':'Away',home?'blue':'')} <strong style="margin-left:5px">${esc(opponent)}</strong></td><td>${esc(game.fieldName)}${game.fieldException?`<div style="margin-top:4px">${badge('Field exception','red')}</div>`:''}</td><td>${rest===null?'—':`${rest} day${rest===1?'':'s'}`}</td><td>${game.attention?`${badge('Needs review','amber')}<div class="muted" style="font-size:10px;margin-top:5px">${esc(game.adjustment.summary)}</div>`:badge('Scheduled','green')}</td></tr>`;}).join('');
 modal(`${team.name} schedule`,`<p class="eyebrow">${esc(division.name)}</p><div class="grid four section-gap"><div class="card metric"><div class="metric-label">Games</div><div class="metric-value">${games.length}</div></div><div class="card metric"><div class="metric-label">Home / away</div><div class="metric-value" style="font-size:22px">${homeGames} / ${games.length-homeGames}</div></div><div class="card metric"><div class="metric-label">Weekend</div><div class="metric-value">${weekendGames}</div></div><div class="card metric"><div class="metric-label">Needs review</div><div class="metric-value">${attentionGames}</div></div></div><div class="table-wrap section-gap"><table><thead><tr><th>Date & time</th><th>Opponent</th><th>Field</th><th>Rest</th><th>Status</th></tr></thead><tbody>${rows||`<tr><td colspan="5" class="muted">No games scheduled for this team.</td></tr>`}</tbody></table></div>`,`<button class="btn secondary" data-close-modal>Close</button><button class="btn blue" data-download-team="${teamId}" data-division-id="${divisionId}">Download team CSV</button>`);
 document.querySelectorAll('[data-close-modal]').forEach(button=>button.onclick=closeModal);
 document.querySelector('[data-download-team]').onclick=()=>downloadTeamSchedule(teamId,divisionId);
}
function divisionModal(id){
 const d=id?state.divisions.find(x=>x.id===id):{id:`d${Date.now()}`,name:'New Division',sport:'Baseball',teamCount:6,gamesPerTeam:12,gameCountOverride:false,start:state.season.start,end:state.season.end,days:['Tue','Wed'],startTimes:{Tue:['18:30'],Wed:['18:30']},enabled:true,duration:90,innings:6,official:'Volunteer',officialCount:0,format:'Balanced 12-game rotation',gamesPerWeek:2,color:COLORS[state.divisions.length%COLORS.length],teams:[]};
 if(!d.teams.length)d.teams=teamsFor(d);
 const teamRows=d.teams.map(team=>`<tr><td><input name="teamName:${team.id}" value="${esc(team.name)}"></td><td><div class="button-row">${DAY_NAMES.map(day=>`<label class="badge"><input type="checkbox" name="teamDays:${team.id}" value="${day}" ${(team.availableDays||d.days).includes(day)?'checked':''}> ${day}</label>`).join('')}</div></td></tr>`).join('');
 const timeRows=DAY_NAMES.map(day=>`<div class="field-group"><label>${day} start times</label><input name="times:${day}" value="${esc(((d.startTimes||{})[day]||[]).join(', '))}" placeholder="e.g. 18:30 or 10:00, 12:00"><small>Comma-separated; used only when ${day} is enabled.</small></div>`).join('');
 const gameCountField=`<div class="field-group"><label for="gamesPerTeam">Games per team</label><input id="gamesPerTeam" name="gamesPerTeam" type="number" min="1" value="${d.gamesPerTeam}" ${d.gameCountOverride?'':'disabled'}><label class="checkbox-row" style="margin-top:7px"><input type="checkbox" name="gameCountOverride" ${d.gameCountOverride?'checked':''}> Override 12-game default</label></div>`;
 modal(id?'Edit division':'Add division',`<form id="division-form"><input type="hidden" name="id" value="${d.id}"><div class="form-grid">${input('Division name','name',d.name)}<div class="field-group"><label>Sport</label><select name="sport">${['Tee-ball','Baseball','Softball'].map(x=>`<option ${x===d.sport?'selected':''}>${x}</option>`).join('')}</select></div>${input('Team count','teamCount',d.teamCount,'number')}${gameCountField}${input('Game duration (minutes)','duration',d.duration,'number')}${input('Innings','innings',d.innings,'number')}<div class="field-group"><label>Official qualification</label><select name="official">${['Volunteer','Trained','Certified'].map(x=>`<option ${x===d.official?'selected':''}>${x}</option>`).join('')}</select></div>${input('Officials required','officialCount',d.officialCount,'number')}${input('Division starts','start',d.start||'','date')}${input('Division ends','end',d.end||'','date')}</div><label class="checkbox-row section-gap"><input type="checkbox" name="enabled" ${d.enabled!==false?'checked':''}> Include this division in schedule generation</label><div class="field-group section-gap"><label>Eligible scheduling days</label><div class="button-row">${DAY_NAMES.map(day=>`<label class="badge"><input type="checkbox" name="days" value="${day}" ${d.days.includes(day)?'checked':''}> ${day}</label>`).join('')}</div><small>These are availability windows, not a required weekly pattern.</small></div><div class="form-grid section-gap">${timeRows}</div><div class="section-gap"><label style="display:block;margin-bottom:8px;font-size:11px;font-weight:700">Team names & availability</label><div class="table-wrap"><table><thead><tr><th>Team</th><th>Available days</th></tr></thead><tbody>${teamRows}</tbody></table></div></div></form>`,`${id?'<button class="btn danger" data-delete-division="'+d.id+'">Delete</button>':''}<button class="btn secondary" data-close-modal>Cancel</button><button class="btn blue" data-save-division>Save division</button>`);
 document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=closeModal);
 const overrideToggle=document.querySelector('[name="gameCountOverride"]'),gamesInput=document.querySelector('#gamesPerTeam');overrideToggle.onchange=()=>{gamesInput.disabled=!overrideToggle.checked;if(!overrideToggle.checked)gamesInput.value=12;};
 document.querySelector('[data-save-division]').onclick=()=>{
  const fd=new FormData(document.querySelector('#division-form')),existing=state.divisions.find(x=>x.id===d.id),days=fd.getAll('days');
  const startTimes=Object.fromEntries(days.map(day=>[day,String(fd.get(`times:${day}`)||'').split(',').map(value=>value.trim()).filter(Boolean)]));
  const gameCountOverride=fd.has('gameCountOverride'),gamesPerTeam=gameCountOverride?Number(fd.get('gamesPerTeam')):12,teamCount=Number(fd.get('teamCount'));
  if(teamCount*gamesPerTeam%2!==0){toast('Team count × games per team must be even');return;}
  const next={...d,name:fd.get('name'),sport:fd.get('sport'),teamCount,gamesPerTeam,gameCountOverride,format:`Balanced ${gamesPerTeam}-game rotation`,duration:Number(fd.get('duration')),innings:Number(fd.get('innings')),official:fd.get('official'),officialCount:Number(fd.get('officialCount')),start:fd.get('start')||null,end:fd.get('end')||null,enabled:fd.has('enabled'),days,startTimes};
  next.teams=(existing?.teams||d.teams).map(team=>({...team,name:fd.get(`teamName:${team.id}`)||team.name,availableDays:fd.getAll(`teamDays:${team.id}`).filter(day=>days.includes(day))}));
  while(next.teams.length<next.teamCount)next.teams.push({id:`${next.id}-t${next.teams.length+1}`,name:`Team ${next.teams.length+1}`,availableDays:[...days]});
  next.teams=next.teams.slice(0,next.teamCount);
  if(existing)Object.assign(existing,next);else state.divisions.push(next);save();closeModal();render();toast('Division saved');
 };
 const del=document.querySelector('[data-delete-division]');if(del)del.onclick=()=>{state.divisions=state.divisions.filter(x=>x.id!==d.id);state.fields.forEach(f=>f.divisions=f.divisions.filter(x=>x!==d.id));save();closeModal();render();};
}
function fieldModal(id){
 const f=id?state.fields.find(x=>x.id===id):{id:`f${Date.now()}`,name:'New Field',complex:'New',address:'',city:'Westerville',state:'OH',zip:'',type:'unverified',divisions:[],lights:false,weekdayOpen:'18:00',weekendOpen:'10:00',close:'21:00',turnover:15,closed:false};
 modal(id?'Edit field':'Add field',`<form id="field-form"><div class="form-grid">${input('Field name','name',f.name)}${input('Park / complex','complex',f.complex)}${input('Street address','address',f.address||'')}<div class="field-group"><label>Configuration</label><select name="type">${['unverified','tee','small','medium','large'].map(x=>`<option value="${x}" ${x===f.type?'selected':''}>${x==='unverified'?'Unverified':x}</option>`).join('')}</select></div>${input('Turnover (minutes)','turnover',f.turnover,'number')}${input('Weekday opening','weekdayOpen',f.weekdayOpen,'time')}${input('Weekend opening','weekendOpen',f.weekendOpen,'time')}${input('Closing / daylight cutoff','close',f.close,'time')}<div class="field-group"><label>Resource status</label><label class="checkbox-row"><input type="checkbox" name="closed" ${f.closed?'checked':''}> Closed for scheduling</label><label class="checkbox-row" style="margin-top:10px"><input type="checkbox" name="lights" ${f.lights?'checked':''}> Field has lights</label></div></div><div class="field-group section-gap"><label>Eligible divisions</label><div class="grid two">${state.divisions.map(d=>`<label class="checkbox-row"><input type="checkbox" name="divisions" value="${d.id}" ${f.divisions.includes(d.id)?'checked':''}> ${d.name}</label>`).join('')}</div></div></form>`,`${id?'<button class="btn danger" data-delete-field="'+f.id+'">Delete</button>':''}<button class="btn secondary" data-close-modal>Cancel</button><button class="btn blue" data-save-field>Save field</button>`);
 document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=closeModal);document.querySelector('[data-save-field]').onclick=()=>{const fd=new FormData(document.querySelector('#field-form'));const next={...f,name:fd.get('name'),complex:fd.get('complex'),address:fd.get('address'),type:fd.get('type'),turnover:Number(fd.get('turnover')),weekdayOpen:fd.get('weekdayOpen'),weekendOpen:fd.get('weekendOpen'),close:fd.get('close'),closed:fd.has('closed'),lights:fd.has('lights'),divisions:fd.getAll('divisions')};const existing=state.fields.find(x=>x.id===f.id);if(existing)Object.assign(existing,next);else state.fields.push(next);save();closeModal();render();toast('Field saved');};const del=document.querySelector('[data-delete-field]');if(del)del.onclick=()=>{state.fields=state.fields.filter(x=>x.id!==f.id);save();closeModal();render();};
}
function importModal(){ modal('Import existing schedule',`<div class="callout"><span>i</span><div><strong>Expected columns</strong><p>game_id, division, date, time, home, away, field. The demo validates the file locally and never uploads it.</p></div></div><div class="field-group section-gap"><label>Select CSV file</label><input id="csv-file" type="file" accept=".csv,text/csv"><small>Imported data replaces the current local draft after confirmation.</small></div><div id="import-preview" class="muted section-gap">No file selected.</div>`,`<button class="btn secondary" data-close-modal>Cancel</button><button class="btn blue" id="confirm-import" disabled>Import planning copy</button>`);document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=closeModal);let parsed=[];document.querySelector('#csv-file').onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const lines=String(reader.result).trim().split(/\r?\n/),headers=lines.shift().split(',').map(x=>x.trim());parsed=lines.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[headers[i],v.trim()])));document.querySelector('#import-preview').innerHTML=`${badge(`${parsed.length} rows read`,'green')} Columns: ${headers.join(', ')}`;document.querySelector('#confirm-import').disabled=!parsed.length;};reader.readAsText(file);};document.querySelector('#confirm-import').onclick=()=>{state.schedule=parsed.map((r,i)=>({id:r.game_id||`IMP-${i+1}`,divisionId:state.divisions.find(d=>d.name===r.division)?.id||'',divisionName:r.division||'Imported',sport:state.divisions.find(d=>d.name===r.division)?.sport||'Baseball',date:r.date,time:r.time,homeName:r.home,awayName:r.away,homeId:`import-home-${i}`,awayId:`import-away-${i}`,fieldName:r.field,fieldId:state.fields.find(f=>f.name===r.field)?.id||'',status:'scheduled',coverage:'unverified',officialRequired:true,imported:true}));state.season.source='Imported CSV';state.season.sourceDate=new Date().toLocaleString();state.generatedAt=new Date().toISOString();state.version+=1;save();closeModal();render();toast('Planning copy imported');}; }

function csvEscape(v){ const s=String(v??'');return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s; }
function download(filename,rows){ const csv=rows.map(r=>r.map(csvEscape).join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);toast(`${filename} downloaded locally`); }
function downloadSchedule(){download('wybsl-spring-2026-schedule.csv',[['game_id','division','date','time','away','home','field','status','official_coverage','needs_review','adjustment_type','adjustment_rationale'],...state.schedule.map(g=>[g.id,g.divisionName,g.date,g.time,g.awayName,g.homeName,g.fieldName,g.status,g.coverage,g.attention?'yes':'no',g.adjustment?.type||'',g.adjustment?.summary||''])]);}
function downloadChanges(){download('wybsl-schedule-changes.csv',[['game_id','previous_date','previous_time','previous_field','new_date','new_time','new_field','status','rationale'],...state.postponed.map(r=>[r.gameId,r.oldDate,r.oldTime,r.oldField,r.newDate,r.newTime,r.fieldName,'proposed','Batch rainout repair; minimal disruption'])]);}
function downloadTeamSchedule(teamId,divisionId){
 const division=state.divisions.find(item=>item.id===divisionId),team=division?.teams.find(item=>item.id===teamId);if(!team)return;
 const games=state.schedule.filter(game=>game.homeId===teamId||game.awayId===teamId).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
 const rows=[['game_id','division','team','date','time','home_away','opponent','field','official_coverage','needs_review','adjustment'],...games.map(game=>[game.id,division.name,team.name,game.date,game.time,game.homeId===teamId?'home':'away',game.homeId===teamId?game.awayName:game.homeName,game.fieldName,game.coverage,game.attention?'yes':'no',game.adjustment?.summary||''])];
 download(`${division.id}-${team.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-schedule.csv`,rows);
}

function bindView(){
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{state.activeView=b.dataset.go;save();render();});
 document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>handleAction(b.dataset.action));
 document.querySelectorAll('[data-edit-division]').forEach(b=>b.onclick=()=>divisionModal(b.dataset.editDivision));
 document.querySelectorAll('[data-edit-field]').forEach(b=>b.onclick=()=>fieldModal(b.dataset.editField));
 document.querySelectorAll('[data-adjustment-detail]').forEach(button=>button.onclick=()=>adjustmentDetailModal(button.dataset.adjustmentDetail));
 document.querySelectorAll('[data-toggle-rule]').forEach(b=>b.onclick=()=>{const key=b.dataset.toggleRule;state.rules[key]=!state.rules[key];save();render();});
 document.querySelectorAll('[data-rule-range]').forEach(i=>i.oninput=()=>{state.rules[i.dataset.ruleRange]=Number(i.value);i.nextElementSibling.textContent=i.value;save();});
 document.querySelectorAll('[data-rainout]').forEach(input=>input.onchange=()=>{const game=state.schedule.find(item=>item.id===input.dataset.rainout);state.selectedRainouts=input.checked?[...new Set([...state.selectedRainouts,input.dataset.rainout])]:state.selectedRainouts.filter(id=>id!==input.dataset.rainout);if(!input.checked&&game)state.rainoutClosedFields=state.rainoutClosedFields.filter(id=>id!==game.fieldId);state.repairs=[];state.repairFailures=[];save();render();});
 document.querySelectorAll('[data-rainout-field]').forEach(input=>input.onchange=()=>{const fieldId=input.dataset.rainoutField,fieldGames=state.schedule.filter(game=>game.status==='scheduled'&&game.date===state.rainoutDate&&game.fieldId===fieldId).map(game=>game.id);if(input.checked){state.rainoutClosedFields=[...new Set([...state.rainoutClosedFields,fieldId])];state.selectedRainouts=[...new Set([...state.selectedRainouts,...fieldGames])];}else{state.rainoutClosedFields=state.rainoutClosedFields.filter(id=>id!==fieldId);state.selectedRainouts=state.selectedRainouts.filter(id=>!fieldGames.includes(id));}state.repairs=[];state.repairFailures=[];save();render();});
 document.querySelectorAll('[data-team-detail]').forEach(element=>{const open=event=>{event.stopPropagation();teamScheduleModal(element.dataset.teamDetail,element.dataset.divisionId);};element.onclick=open;element.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open(event);}};});
 const sf=document.querySelector('#season-form');if(sf)sf.onsubmit=e=>{e.preventDefault();const fd=new FormData(sf);['name','start','end','weekdayStart','weekendStart','daylight'].forEach(k=>state.season[k]=fd.get(k));state.season.timezone='America/New_York';state.season.safetyBuffer=Number(fd.get('safetyBuffer'));state.season.holidays=String(fd.get('holidays')).split(/\s+/).filter(Boolean);save();toast('Season settings saved');render();};
 const filter=document.querySelector('#schedule-filter');if(filter)filter.onchange=()=>{state.scheduleFilter=filter.value;save();render();};
 const view=document.querySelector('#schedule-view');if(view)view.onchange=()=>{state.scheduleView=view.value;save();render();};
 const rainoutDate=document.querySelector('#rainout-date');if(rainoutDate)rainoutDate.onchange=()=>{const hasGames=state.schedule.some(game=>game.status==='scheduled'&&game.date===rainoutDate.value);if(!hasGames){toast('Choose a date that contains scheduled games');render();return;}state.rainoutDate=rainoutDate.value;state.selectedRainouts=[];state.rainoutClosedFields=[];state.repairs=[];state.repairFailures=[];save();render();};
}
function handleAction(action){
 if(action==='generate'){generateSchedule();state.activeView='schedule';save();render();toast(`${state.schedule.length} games placed in draft v${state.version}`);}
 if(action==='open-hard-reset')hardResetModal();
 if(action==='add-division')divisionModal(); if(action==='add-field')fieldModal(); if(action==='open-import')importModal();
 if(action==='select-all-rainouts'){state.selectedRainouts=state.schedule.filter(game=>game.status==='scheduled'&&game.date===state.rainoutDate).map(game=>game.id);state.repairs=[];state.repairFailures=[];save();render();toast(`${state.selectedRainouts.length} games selected for the rainout simulation`);}
 if(action==='clear-rainouts'){state.selectedRainouts=[];state.rainoutClosedFields=[];state.repairs=[];state.repairFailures=[];save();render();}
 if(action==='find-repairs')findRepairs();
 if(action==='apply-repairs'){
  const batchDate=state.repairs[0]?.oldDate||state.rainoutDate,batch={id:`rainout-${Date.now()}`,label:`Rainout makeup draft${batchDate?` · ${gameDate(batchDate)}`:''}`,createdAt:new Date().toISOString(),kind:'rainout'};
  state.postponed.push(...state.repairs);
  for(const r of state.repairs){const g=state.schedule.find(x=>x.id===r.gameId);if(g){const priorAdjustment=g.adjustment?clone(g.adjustment):null;g.previous={date:g.date,time:g.time,fieldName:g.fieldName};g.date=r.newDate;g.time=r.newTime;g.fieldId=r.fieldId;g.fieldName=r.fieldName;g.status='scheduled';g.attention=true;g.adjustment={type:'Rainout makeup',summary:`Moved from ${gameDate(r.oldDate)} at ${formatTime(r.oldTime)} on ${r.oldField}`,selected:`${gameDate(r.newDate)} at ${formatTime(r.newTime)} on ${r.fieldName}`,originalReason:'The original game was canceled in the rainout workbench.',alternatives:[...r.alternatives],batch:clone(batch),priorAdjustment,originalPlan:{attemptedDates:[r.oldDate],eligibleDays:[DAY_NAMES[dateObj(r.oldDate).getDay()]],configuredSlots:[`${DAY_NAMES[dateObj(r.oldDate).getDay()]} ${formatTime(r.oldTime)}`],assignedFields:[r.oldField],details:'The original date, time, and field were removed from the active schedule by the administrator.'},resolution:{searchSteps:['Locked every unaffected game in its current slot.','Searched Saturday at 10:00 AM, 1:00 PM, and 4:00 PM and Sunday at 1:00 PM and 4:00 PM.','Used an eligible weekday only if no conflict-free weekend makeup existed.'],preserved:['No team doubleheaders','No field overlap or turnover conflict','Operating hours and daylight safety buffer'],whySelected:r.weekend?'This was the highest-ranked available weekend makeup slot.':'No conflict-free weekend slot remained, so this marked weekday fallback was the best valid option.'}};}}
  state.repairs=[];state.repairFailures=[];state.selectedRainouts=[];state.rainoutDate=null;state.rainoutClosedFields=[];state.status='proposed';save();render();toast('Makeup draft applied and marked for review');
 }
 if(action==='approve'){state.status='approved';state.approver=document.querySelector('#approver')?.value||state.approver||'League Administrator';state.approvalDate=document.querySelector('#approvalDate')?.value||new Date().toISOString().slice(0,10);state.approvalNotes=document.querySelector('#approval-notes')?.value||state.approvalNotes;save('Approved locally');render();toast('Local draft approved — not externally published');}
 if(action==='download-csv')downloadSchedule(); if(action==='download-changes')downloadChanges();
}

async function initialize(){
 try {
  const response=await fetch('./fields.json');
  if(!response.ok)throw new Error(`Field template returned ${response.status}`);
  const payload=await response.json();
  if(!Array.isArray(payload.results))throw new Error('Field template is missing a results array');
  state=loadState(mapFieldTemplate(payload.results));
 } catch(error) {
  state=loadState([]);
  console.error('Unable to load fields.json:',error);
 }
 document.querySelector('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;state.activeView=b.dataset.view;save();render();});
 save();render();
}
if(typeof window!=='undefined')initialize();
