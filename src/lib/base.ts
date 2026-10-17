export function pagesBase(repository?: string) {
  const name = repository?.split('/')[1];
  return name && !name.endsWith('.github.io') ? `/${name}/` : './';
}
