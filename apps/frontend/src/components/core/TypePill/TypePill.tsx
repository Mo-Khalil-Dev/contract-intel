import { useTypePill, type UseTypePillProps } from './useTypePill';

export function TypePill(props: UseTypePillProps) {
  const { style, displayLabel } = useTypePill(props);

  return (
    <span
      className="font-sans inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold"
      style={style}
    >
      {displayLabel}
    </span>
  );
}
