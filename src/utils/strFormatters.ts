export function cls(...args: Array<string | false | undefined>) {
  return args.filter(Boolean).join(' ');
}
