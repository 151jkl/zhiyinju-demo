const people = [
  {name:'周也', role:'独立开发者 · 上海', initials:'周', color:'#f5c5af', score:'94%', activity:'刚刚活跃', activityTone:'now', tags:['AI 产品','长期主义'], quote:'“把复杂的东西做得好玩，是一种能力。”'},
  {name:'苏青', role:'编辑 / 纪录片爱好者', initials:'苏', color:'#c8bdf0', score:'89%', activity:'3 天前活跃', activityTone:'recent', tags:['表达','城市观察'], quote:'“我更在意一个问题背后的真实生活。”'},
  {name:'Kaito', role:'研究生 · 认知科学', initials:'K', color:'#b9dece', score:'86%', activity:'2 个月前活跃', activityTone:'away', tags:['心理学','学习方法'], quote:'“好的讨论不是说服，而是一起把问题讲清楚。”'}
];
const grid = document.querySelector('#match-grid');
function renderCards(){ grid.innerHTML = people.map((p,i)=>`<article class="match-card" data-person="${i}"><div class="card-top"><div class="person-avatar" style="background:${p.color}">${p.initials}</div><span class="activity ${p.activityTone}"><i></i>${p.activity}</span><span class="card-heart">♡</span></div><h4>${p.name}</h4><span class="role">${p.role}</span><p>${p.quote}</p><div class="match-score"><span>${p.tags.join(' · ')}</span><b>${p.score} 同频</b></div></article>`).join(''); document.querySelectorAll('.match-card').forEach(card=>card.addEventListener('click',()=>showToast('已生成与 '+people[card.dataset.person].name+' 的专属破冰话题')))}
renderCards();
const toast=document.querySelector('#toast');
function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}
document.querySelector('#refresh-btn').addEventListener('click',()=>{showToast('正在用新的话题为你匹配…');setTimeout(()=>{people.reverse();renderCards();showToast('匹配完成，发现了新的同频关系');},700)});
document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.view').forEach(x=>x.classList.remove('active-view'));document.querySelector('#'+btn.dataset.view+'-view').classList.add('active-view');document.querySelector('#view-title').textContent={match:'今日，和一个同频的人聊聊',roundtable:'把观点放在桌面上，认识彼此',profile:'先认识自己，再遇见同频的人'}[btn.dataset.view]}));
