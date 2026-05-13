/**
 * Centralised icon module.
 *
 * Re-exports a curated set of Lucide icons. All icon usage in the app
 * MUST import from here — no inline <svg> elsewhere.
 *
 * To add a new icon: import it from lucide-react and re-export below.
 * Icons inherit text colour via `currentColor` (built into Lucide).
 */
export {
  AlertCircle as AlertIcon,
  ArrowRight as ArrowRightIcon,
  Check as CheckIcon,
  CheckCircle2 as CheckCircleIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  CircleAlert as InfoIcon,
  Download as DownloadIcon,
  ExternalLink as ExternalLinkIcon,
  Eye as EyeIcon,
  FileText as FileIcon,
  Filter as FilterIcon,
  LogOut as LogoutIcon,
  Menu as MenuIcon,
  MoreVertical as MoreIcon,
  Pencil as EditIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Trash2 as TrashIcon,
  Upload as UploadIcon,
  User as UserIcon,
  X as CloseIcon,
} from 'lucide-react';
