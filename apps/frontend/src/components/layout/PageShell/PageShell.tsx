import { usePageShell, type UsePageShellProps } from './usePageShell';

export function PageShell(props: UsePageShellProps) {
  const { children, header } = props;
  const { containerClass, contentClass } = usePageShell(props);

  return (
    <div className={containerClass}>
      {header}
      <main className={contentClass}>{children}</main>
    </div>
  );
}
