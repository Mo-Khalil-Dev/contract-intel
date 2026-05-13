import { useOrgBanner, type UseOrgBannerProps } from './useOrgBanner';

export function OrgBanner(props: UseOrgBannerProps) {
  const { orgName, workspaceTag } = props;
  const { statusColor, statusText } = useOrgBanner(props);

  return (
    <div className="bg-surface border-border w-full border-b">
      <div className="mx-auto flex max-w-[1120px] items-center px-md py-sm md:px-lg">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink font-bold">{orgName}</span>
          {workspaceTag && (
            <>
              <span className="text-ink-mute">·</span>
              <span className="text-ink-soft">{workspaceTag}</span>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
            aria-hidden="true"
          />
          <span className="text-ink-soft text-xs">{statusText}</span>
        </div>
      </div>
    </div>
  );
}
