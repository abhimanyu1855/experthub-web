# Graph Report - /Users/sambhar/Desktop/experthub-web  (2026-07-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 578 nodes · 1448 edges · 25 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20

## God Nodes (most connected - your core abstractions)
1. `cn()` - 222 edges
2. `Button` - 35 edges
3. `api` - 35 edges
4. `Badge()` - 29 edges
5. `getSubdomain()` - 21 edges
6. `useTenant()` - 15 edges
7. `fadeInUp` - 14 edges
8. `Input()` - 13 edges
9. `Separator()` - 13 edges
10. `Tabs()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `AccordionItem()` --calls--> `cn()`  [EXTRACTED]
  src/app/components/ui/accordion.tsx → src/app/components/ui/utils.ts
- `AccordionTrigger()` --calls--> `cn()`  [EXTRACTED]
  src/app/components/ui/accordion.tsx → src/app/components/ui/utils.ts
- `AccordionContent()` --calls--> `cn()`  [EXTRACTED]
  src/app/components/ui/accordion.tsx → src/app/components/ui/utils.ts
- `AlertDialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  src/app/components/ui/alert-dialog.tsx → src/app/components/ui/utils.ts
- `AlertDialogContent()` --calls--> `cn()`  [EXTRACTED]
  src/app/components/ui/alert-dialog.tsx → src/app/components/ui/utils.ts

## Import Cycles
- None detected.

## Communities (25 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (45): Message, Badge(), badgeVariants, Button, FeatureGate(), FeatureGateProps, PLAN_UPGRADE_LABELS, Input() (+37 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (48): TriageChatbot(), AppShell(), DEFAULT_NOTIF_META, navLinks, NOTIF_TYPE_META, NotificationCenter(), notifMeta(), relativeTime() (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (50): App(), ProtectedRoute(), ProtectedRouteProps, audienceAllowsRole(), AuthAudience, loginPathForAudience(), loginPathForReturnTo(), roleForAudience() (+42 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut() (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (41): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle(), SheetTrigger() (+33 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (33): Avatar(), AvatarFallback(), AvatarImage(), Card(), CardAction(), CardContent(), CardDescription(), CardFooter() (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (13): AccordionContent(), AccordionItem(), AccordionTrigger(), Checkbox(), HoverCardContent(), PopoverContent(), RadioGroup(), RadioGroupItem() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (19): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay(), AlertDialogTitle() (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (18): Command(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator(), CommandShortcut(), Dialog() (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (10): loadRazorpayCheckout(), BookingCreateResponse, CheckoutPage(), commTools, formatPaymentAmount(), RazorpayPayment, RazorpayPaymentPanel(), readPendingCheckout() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.20
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (9): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), THEMES (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (6): BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator()

### Community 18 - "Community 18"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (5): RazorpayCheckout, RazorpayCheckoutOptions, RazorpayFailureResponse, RazorpaySuccessResponse, Window

### Community 20 - "Community 20"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

## Knowledge Gaps
- **103 isolated node(s):** `Message`, `ProtectedRouteProps`, `navLinks`, `NOTIF_TYPE_META`, `DEFAULT_NOTIF_META` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Badge()` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.000) - this node is a cross-community bridge._
- **What connects `Message`, `ProtectedRouteProps`, `navLinks` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05456095481670929 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05654761904761905 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05387205387205387 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.05673758865248227 - nodes in this community are weakly interconnected._