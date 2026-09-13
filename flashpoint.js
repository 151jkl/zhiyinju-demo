const flashStyle = document.createElement('style');
flashStyle.textContent = `.shared-memory{margin-top:20px;border-radius:20px;background:#292a35;color:#fff;padding:23px 25px;position:relative;overflow:hidden}.shared-memory:after{content:'“';position:absolute;right:26px;top:-15px;color:#4d4e5b;font:130px Georgia}.shared-head{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}.shared-head b{font-size:14px}.shared-head span{font-size:10px;color:#e9a080;background:#4a3540;border-radius:99px;padding:6px 8px}.shared-memory p{color:#b8b9c1;font-size:12px;line-height:1.7;max-width:610px;margin:13px 0 17px;position:relative;z-index:1}.shared-topics{display:flex;gap:8px;flex-wrap:wrap;position:relative;z-index:1}.shared-topic{background:#3a3b48;border:1px solid #555360;color:#f4d6c8;border-radius:99px;padding:7px 10px;font-size:10px}.shared-footer{display:flex;align-items:center;gap:9px;margin-top:19px;color:#8f919b;font-size:10px;position:relative;z-index:1}.shared-avatars{display:flex}.shared-avatars i{width:23px;height:23px;border-radius:50%;border:2px solid #292a35;display:grid;place-items:center;font-style:normal;font-size:9px;margin-right:-5px}.shared-avatars i:nth-child(1){background:#f1baa4}.shared-avatars i:nth-child(2){background:#c8bdf0}.shared-avatars i:nth-child(3){background:#b9dece}.shared-action{margin-left:auto;border:0;background:#f0a17f;color:#292a35;border-radius:9px;padding:9px 12px;font:600 10px inherit;cursor:pointer}.shared-action:hover{background:#ffc0a2}`;
document.head.appendChild(flashStyle);
const target = document.querySelector('.insight-banner');
if (target) {
  const card = document.createElement('section');
  card.className = 'shared-memory';
  card.innerHTML = `<div class="shared-head"><b>你们的共同收藏 · 一条可验证的连接</b><span>演示行为交集</span></div><p>你和周也都曾在知乎停留过下面这些问题。不是兴趣标签告诉我们你们相似，而是你们真的被同一批内容打动过。</p><div class="shared-topics"><span class="shared-topic">如何把复杂的事讲清楚？</span><span class="shared-topic">AI 会改变创作者吗？</span><span class="shared-topic">长期主义值得坚持吗？</span></div><div class="shared-footer"><span class="shared-avatars"><i>林</i><i>周</i><i>苏</i></span><span>3 个共同内容节点 · 87% 关系可信度</span><button class="shared-action">打开共同收藏 ↗</button></div>`;
  target.after(card);
  card.querySelector('.shared-action').addEventListener('click', () => {
    const toast = document.querySelector('#toast');
    toast.textContent = '已打开共同收藏：你们可以从第一个问题开始聊';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
  });
}
