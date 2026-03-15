// Re-export the new Radix-based Tooltip as the default for backward compatibility.
// The wrapper Tooltip keeps the same API: <Tooltip label="..." shortcut="...">
import { Tooltip } from '@/components/ui/Tooltip'
export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip'
export default Tooltip
