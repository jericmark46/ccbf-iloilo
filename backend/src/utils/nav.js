export function buildNavTree(links, { includeHidden = false } = {}) {
  const visible = includeHidden ? links : links.filter((link) => link.visible !== false);
  const parents = visible
    .filter((link) => !link.parent)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return parents.map((parent) => {
    const plain = typeof parent.toJSON === 'function' ? parent.toJSON() : parent;
    const children = visible
      .filter((link) => String(link.parent?._id || link.parent) === String(parent._id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((child) => (typeof child.toJSON === 'function' ? child.toJSON() : child));
    return { ...plain, children };
  });
}
