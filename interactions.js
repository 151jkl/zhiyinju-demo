const linkNotes = [
  '这是你：关系网从你最近关注的内容出发。',
  '周也：和你都在意把复杂问题讲简单。',
  '苏青：你们共享城市观察和真实表达。',
  'Kaito：你们都喜欢拆解学习方法。',
  'Ava：你们在长期主义上有相近判断。',
  '米粒：一条从创作延伸出的新连接。',
  '乔：你们都收藏过相似的阅读清单。',
  '这里还有一位未被发现的同好。',
  '言：来自另一条城市观察路径。'
];
document.querySelectorAll('.map-node').forEach((node, index) => node.addEventListener('click', () => {
  document.querySelectorAll('.map-node').forEach(item => item.classList.remove('selected'));
  node.classList.add('selected');
  const toast = document.querySelector('#toast');
  toast.textContent = linkNotes[index] || '这条连接还有更多故事。';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}));
