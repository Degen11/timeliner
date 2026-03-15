// Re-export the new shadcn-style Button as the default for backward compatibility.
// All existing imports of `Button` from this path continue to work.
import { Button } from '@/components/ui/Button'
export { Button, buttonVariants } from '@/components/ui/Button'
export default Button
