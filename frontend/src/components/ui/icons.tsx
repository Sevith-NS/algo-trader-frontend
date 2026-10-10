/**
 * Flint's icon set: a few functional glyphs on a 16px grid, 1.5px stroke,
 * square ends. The design rule is text labels first; an icon appears only
 * where it does a job (close, search, menu, direction, refresh, a tool).
 *
 * Exported under the names the codebase used with lucide-react, so swapping
 * the import is the only change a component needs. Names that were purely
 * decorative render nothing; delete those usages as each screen is rebuilt.
 */
import type { SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  size?: number | string;
  strokeWidth?: number;
};

function glyph(name: string, body: React.ReactNode, filled = false) {
  function Icon({ size = 16, strokeWidth = 1.5, className, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill={filled ? 'currentColor' : 'none'}
        stroke={filled ? 'none' : 'currentColor'}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden="true"
        focusable="false"
        className={className}
        {...rest}
      >
        {body}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

function blank(name: string) {
  function Decorative(props: IconProps): null {
    void props;
    return null;
  }
  Decorative.displayName = name;
  return Decorative;
}

const circle = <circle cx="8" cy="8" r="6" />;

export const Search = glyph('Search', <><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></>);
export const SearchX = Search;
export const X = glyph('X', <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />);
export const Menu = glyph('Menu', <path d="M2 4h12M2 8h12M2 12h12" />);
export const ChevronDown = glyph('ChevronDown', <path d="M4 6l4 4 4-4" />);
export const ArrowRight = glyph('ArrowRight', <path d="M2 8h11M9 4l4 4-4 4" />);
export const ArrowLeft = glyph('ArrowLeft', <path d="M14 8H3M7 4L3 8l4 4" />);
export const ArrowUpRight = glyph('ArrowUpRight', <path d="M4 12l8-8M6 4h6v6" />);
export const ArrowDownRight = glyph('ArrowDownRight', <path d="M4 4l8 8M12 6v6H6" />);
export const TrendingUp = ArrowUpRight;
export const TrendingDown = ArrowDownRight;
export const Send = ArrowRight;
export const ExternalLink = glyph('ExternalLink', <path d="M7 3H3v10h10V9M9 3h4v4M13 3L7 9" />);
export const RefreshCw = glyph('RefreshCw', <path d="M13 8a5 5 0 1 1-1.46-3.54M13 2.5V5.5h-3" />);
export const RotateCw = RefreshCw;
export const Loader2 = glyph('Loader2', <path d="M8 2a6 6 0 1 0 6 6" />);
export const Minus = glyph('Minus', <path d="M3 8h10" />);
export const Play = glyph('Play', <path d="M5 3.5v9l7-4.5z" />, true);
export const Square = glyph('Square', <rect x="4" y="4" width="8" height="8" />, true);
export const Lock = glyph('Lock', <><rect x="3.5" y="7" width="9" height="6.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></>);
export const User = glyph('User', <><circle cx="8" cy="5.5" r="2.5" /><path d="M3 14c.5-3 2.5-4.5 5-4.5s4.5 1.5 5 4.5" /></>);
export const SlidersHorizontal = glyph('SlidersHorizontal', <path d="M2 4h7M12 4h2M2 12h2M7 12h7M10.5 2.5v3M5.5 10.5v3" />);
export const Settings = SlidersHorizontal;
export const MessageSquare = glyph('MessageSquare', <path d="M2.5 3h11v8H6l-3.5 3z" />);
export const Crosshair = glyph('Crosshair', <><circle cx="8" cy="8" r="5" /><path d="M8 1v3M8 12v3M1 8h3M12 8h3" /></>);
export const Ruler = glyph('Ruler', <path d="M2 11L11 2l3 3-9 9zM5 8l1.5 1.5M7 6l1.5 1.5M9 4l1.5 1.5" />);
export const SplitSquareHorizontal = glyph('SplitSquareHorizontal', <path d="M2.5 2.5h11v11h-11zM8 2.5v11" />);
export const Layers = glyph('Layers', <path d="M8 2l6 3-6 3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3" />);

export const AlertTriangle = glyph('AlertTriangle', <path d="M8 2l6.5 11.5h-13zM8 6.5V10M8 11.75v.5" />);
export const ShieldAlert = AlertTriangle;
export const WifiOff = AlertTriangle;
export const AlertCircle = glyph('AlertCircle', <>{circle}<path d="M8 5v3.5M8 10.75v.5" /></>);
export const XCircle = AlertCircle;
export const OctagonX = AlertCircle;
export const Ban = AlertCircle;
export const Info = glyph('Info', <>{circle}<path d="M8 7.5V11M8 5v.5" /></>);
export const CheckCircle2 = glyph('CheckCircle2', <>{circle}<path d="M5.5 8.25l1.75 1.75 3.25-3.5" /></>);
export const ShieldCheck = CheckCircle2;

export const ChevronRight = glyph('ChevronRight', <path d="M6 4l4 4-4 4" />);
export const ArrowUpToLine = glyph('ArrowUpToLine', <path d="M3 2.5h10M8 14V6M4.5 9.5L8 6l3.5 3.5" />);
export const ArrowDownToLine = glyph('ArrowDownToLine', <path d="M3 13.5h10M8 2v8M4.5 6.5L8 10l3.5-3.5" />);
export const RotateCcw = glyph('RotateCcw', <path d="M3 8a5 5 0 1 0 1.46-3.54M3 2.5V5.5h3" />);
export const Check = glyph('Check', <path d="M3 8.5l3 3 7-7" />);
export const Trash2 = glyph('Trash2', <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.75 9.5h6.5L12 4M6.75 7v4M9.25 7v4" />);
export const Eye = glyph('Eye', <><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="2" /></>);
export const EyeOff = glyph('EyeOff', <path d="M2 2l12 12M6.6 6.6A2 2 0 0 0 9.4 9.4M4.2 4.7C2.5 5.9 1.5 8 1.5 8S4 12.5 8 12.5c1.3 0 2.5-.5 3.5-1.1M7 3.6c.3 0 .7-.1 1-.1 4 0 6.5 4.5 6.5 4.5s-.6 1.1-1.7 2.3" />);
export const MousePointer2 = glyph('MousePointer2', <path d="M3 2.5l9.5 4-4 1.5-1.5 4z" />);
export const MoveUpRight = glyph('MoveUpRight', <><path d="M3 13L13 3" /><circle cx="3" cy="13" r="1.25" /><circle cx="13" cy="3" r="1.25" /></>);
export const Rows3 = glyph('Rows3', <path d="M2 3.5h12M2 6.5h12M2 9.5h12M2 12.5h12" />);
export const Eraser = glyph('Eraser', <path d="M6 13.5h7.5M2.5 10l6-6.5 4.5 4.5-6 6.5H5z M5.5 7l4.5 4.5" />);
export const CircleDot = glyph('CircleDot', <><circle cx="8" cy="8" r="5.5" /><circle cx="8" cy="8" r="1.25" /></>);
export const Settings2 = SlidersHorizontal;

// Decorative in every current usage: render nothing.
export const Brain = blank('Brain');
export const Building2 = blank('Building2');
export const Calculator = blank('Calculator');
export const Gauge = blank('Gauge');
export const History = blank('History');
export const Microscope = blank('Microscope');
export const Receipt = blank('Receipt');
export const Shuffle = blank('Shuffle');
export const Target = blank('Target');
export const Timer = blank('Timer');
export const Zap = blank('Zap');
export const Activity = blank('Activity');
export const Award = blank('Award');
export const BarChart2 = blank('BarChart2');
export const BookOpen = blank('BookOpen');
export const Bot = blank('Bot');
export const BrainCircuit = blank('BrainCircuit');
export const Briefcase = blank('Briefcase');
export const CalendarClock = blank('CalendarClock');
export const CandlestickChart = blank('CandlestickChart');
export const Compass = blank('Compass');
export const Dices = blank('Dices');
export const FileSearch = blank('FileSearch');
export const Flame = blank('Flame');
export const FlaskConical = blank('FlaskConical');
export const Footprints = blank('Footprints');
export const Gavel = blank('Gavel');
export const Globe2 = blank('Globe2');
export const Handshake = blank('Handshake');
export const Hourglass = blank('Hourglass');
export const Landmark = blank('Landmark');
export const ListChecks = blank('ListChecks');
export const ListOrdered = blank('ListOrdered');
export const Newspaper = blank('Newspaper');
export const PieChart = blank('PieChart');
export const Quote = blank('Quote');
export const Scale = blank('Scale');
export const ScanSearch = blank('ScanSearch');
export const Sparkle = blank('Sparkle');
export const Sparkles = blank('Sparkles');
export const Stamp = blank('Stamp');
export const Swords = blank('Swords');
export const ThumbsUp = blank('ThumbsUp');
export const Users = blank('Users');
export const Users2 = blank('Users2');
export const Wallet = blank('Wallet');
export const Waves = blank('Waves');
