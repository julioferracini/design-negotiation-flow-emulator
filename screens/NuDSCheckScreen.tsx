import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Platform,
  Alert,
  Animated,
  TextInput as RNTextInput,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useThemeMode } from '../config/ThemeModeContext';
import {
  useNuDSTheme,
  NText,
  Box,
  Divider,
  Field,
  Button,
  ButtonLink,
  Badge,
  TopBar,
  ListRow,
  ListSection,
  SectionTitle,
  CalloutBox,
  CheckoutBottomBar,
  BottomBar,
  BottomSheet,
  Avatar,
  AvatarGroup,
  CircularLoader,
  DataSelect,
  FilterBar,
  Header,
  InlineActions,
  LoadingButton,
  TextField,
  Tooltip,
  TransactionListRow,
  ActionSheet,
  DatePicker,
  PinCode,
  Select,
  NextBottomBar,
  PinChallenge,
  CrossSellCarousel,
  TransactionWidget,
  DashboardHero,
  LimitBar,
  Widget2x2,
  Widget4xN,
  ArrowBackIcon,
  CheckCircleIcon,
  InfoIcon,
  NuLogoIcon,
  SettingsIcon,
  StarIcon,
  CardIcon,
  PixIcon,
  BellIcon,
  HeartIcon,
  SparkleIcon,
  SearchIcon,
  CloseIcon,
  AddIcon,
  TrashIcon,
  DownloadIcon,
  ShareIosIcon,
  UserIcon,
  WalletIcon,
  MoneyInIcon,
  MoneyOutIcon,
  CalendarIcon,
  LockIcon,
  ShieldCheckIcon,
  BankIcon,
  ReceiptIcon,
  HistoryIcon,
  HelpIcon,
  CopyIcon,
  PencilIcon,
  GlobeIcon,
  ChevronIcon,
  ExpandMoreIcon,
  ListIcon,
  WarningIcon,
  CheckIcon,
  ArrowRightIcon,
  HomeTemporaryIcon,
  ShoppingCartIcon,
  CashbackIcon,
  GiftCardsIcon,
  FireIcon,
  TrophyIcon,
  RibbonIcon,
  TargetIcon,
  BoltIcon,
  SunIcon,
  MoonIcon,
} from '@nubank/nuds-vibecode-react-native';

type Props = { onBack: () => void };

const noop = () => {};
const alert = (msg: string) => () => Alert.alert('NuDS', msg);

/* ━━━ 1 · COLOR TOKENS ━━━ */
function ColorTokensSection() {
  const t = useNuDSTheme();
  const groups: { title: string; items: { label: string; value: string }[] }[] = [
    {
      title: 'Brand & Feedback',
      items: [
        { label: 'main', value: t.color.main },
        { label: 'positive', value: t.color.positive },
        { label: 'warning', value: t.color.warning },
        { label: 'negative', value: t.color.negative },
      ],
    },
    {
      title: 'Content',
      items: [
        { label: 'content.primary', value: t.color.content.primary },
        { label: 'content.secondary', value: t.color.content.secondary },
        { label: 'content.main', value: t.color.content.main },
      ],
    },
    {
      title: 'Background',
      items: [
        { label: 'bg.primary', value: t.color.background.primary },
        { label: 'bg.secondary', value: t.color.background.secondary },
      ],
    },
    {
      title: 'Border',
      items: [
        { label: 'border.primary', value: t.color.border.primary },
        { label: 'border.secondary', value: t.color.border.secondary },
      ],
    },
  ];
  return (
    <View>
      <SectionTitle title="Color Tokens" />
      {groups.map((g) => (
        <View key={g.title}>
          <NText variant="labelSmallStrong" style={ss.subHeading}>{g.title}</NText>
          <View style={ss.tokenGrid}>
            {g.items.map((c) => (
              <View key={c.label} style={ss.tokenItem}>
                <View style={[ss.colorSwatch, { backgroundColor: c.value }]} />
                <NText variant="label2XSmallDefault" tone="secondary">{c.label}</NText>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/* ━━━ 2 · SPACING ━━━ */
function SpacingSection() {
  const t = useNuDSTheme();
  const keys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12] as const;
  return (
    <View>
      <SectionTitle title="Spacing Tokens" />
      <NText variant="paragraphSmallDefault" tone="secondary" style={ss.desc}>
        spacing[n] → px value. Squares sized at token value.
      </NText>
      <View style={ss.spacingRow}>
        {keys.map((n) => (
          <View key={n} style={ss.spacingItem}>
            <View style={{ width: Math.max(t.spacing[n], 4), height: Math.max(t.spacing[n], 4), backgroundColor: t.color.main, borderRadius: 2 }} />
            <NText variant="label2XSmallDefault" tone="secondary">{n}={t.spacing[n]}</NText>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ━━━ 3 · RADIUS ━━━ */
function RadiusSection() {
  const t = useNuDSTheme();
  const keys = ['none', 'sm', 'md', 'lg', 'xl', 'xxl', 'full'] as const;
  return (
    <View>
      <SectionTitle title="Radius Tokens" />
      <View style={ss.radiusRow}>
        {keys.map((r) => (
          <View key={r} style={ss.radiusItem}>
            <View style={{ width: 44, height: 44, borderRadius: t.radius[r], borderWidth: 2, borderColor: t.color.main }} />
            <NText variant="label2XSmallDefault" tone="secondary">{r}</NText>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ━━━ 4 · ELEVATION ━━━ */
function ElevationSection() {
  const t = useNuDSTheme();
  const levels = ['none', 'level1', 'level2', 'level3', 'sticky', 'dropdown', 'modal'] as const;
  return (
    <View>
      <SectionTitle title="Elevation Tokens" />
      <View style={ss.elevationRow}>
        {levels.map((l) => (
          <View key={l} style={[ss.elevationCard, t.elevation[l], { shadowColor: t.color.content.primary, backgroundColor: t.color.background.primary }]}>
            <NText variant="label2XSmallStrong">{l}</NText>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ━━━ 5 · TYPOGRAPHY (all 22 variants) ━━━ */
function TypographySection() {
  const variants = [
    'titleXLarge', 'titleLarge', 'titleMedium', 'titleSmall', 'titleXSmall',
    'subtitleMediumDefault', 'subtitleMediumStrong', 'subtitleSmallDefault', 'subtitleSmallStrong',
    'paragraphMediumDefault', 'paragraphMediumStrong', 'paragraphSmallDefault', 'paragraphSmallStrong',
    'labelMediumDefault', 'labelMediumStrong', 'labelSmallDefault', 'labelSmallStrong',
    'labelXSmallDefault', 'labelXSmallStrong', 'label2XSmallDefault', 'label2XSmallStrong',
  ] as const;
  return (
    <View>
      <SectionTitle title="Typography" secondary="22 variants" />
      <Box surface="primary" style={ss.typographyBox}>
        {variants.map((v) => (
          <NText key={v} variant={v}>{v}</NText>
        ))}
      </Box>
    </View>
  );
}

/* ━━━ 6 · PRIMITIVES: Box, NText tones, Field ━━━ */
function PrimitivesSection() {
  const t = useNuDSTheme();
  const tones = ['primary', 'secondary', 'inverse', 'positive', 'warning', 'negative'] as const;
  return (
    <View>
      <SectionTitle title="Primitives" />
      <NText variant="labelSmallStrong" style={ss.subHeading}>Box (surfaces)</NText>
      <View style={ss.boxRow}>
        {(['screen', 'primary', 'secondary'] as const).map((s) => (
          <Box key={s} surface={s} style={ss.boxDemo}>
            <NText variant="labelSmallDefault">{s}</NText>
          </Box>
        ))}
      </View>
      <NText variant="labelSmallStrong" style={ss.subHeading}>NText (tones)</NText>
      <Box surface="primary" style={ss.tonesBox}>
        {tones.map((tone) => (
          <NText key={tone} variant="paragraphSmallStrong" tone={tone}
            style={tone === 'inverse' ? { backgroundColor: t.color.content.primary, padding: 4, borderRadius: 4 } : undefined}>
            {tone}
          </NText>
        ))}
      </Box>
      <NText variant="labelSmallStrong" style={ss.subHeading}>Field</NText>
      <Field label="Email" hint="We'll never share your email">
        <Box surface="secondary" style={{ height: 44, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 12 }}>
          <NText variant="paragraphMediumDefault" tone="secondary">user@nubank.com.br</NText>
        </Box>
      </Field>
      <View style={{ height: 8 }} />
      <Field label="Password" error="Password is required">
        <Box surface="secondary" style={{ height: 44, borderRadius: 8 }} />
      </Field>
    </View>
  );
}

/* ━━━ 7 · BUTTONS ━━━ */
function ButtonsSection() {
  const [loading, setLoading] = useState(false);
  return (
    <View>
      <SectionTitle title="Button" secondary="4 variants" />
      <View style={ss.gap12}>
        <Button label="Primary" variant="primary" expanded onPress={alert('Primary')} />
        <Button label="Secondary" variant="secondary" expanded onPress={alert('Secondary')} />
        <Button label="Ghost" variant="ghost" expanded onPress={alert('Ghost')} />
        <Button label="Destructive" variant="destructive" expanded onPress={alert('Destructive')} />
        <Button label="Loading" variant="primary" expanded loading={loading} onPress={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }} />
        <View style={ss.row}>
          <Button label="Compact" variant="primary" compact />
          <Button variant="primary" iconOnly icon={<StarIcon size={20} color="#FFF" />} />
          <Button variant="secondary" iconOnly icon={<HeartIcon size={20} />} />
        </View>
      </View>
      <SectionTitle title="ButtonLink" style={{ marginTop: 16 }} />
      <View style={ss.gap12}>
        <ButtonLink label="See details" onPress={noop} />
        <ButtonLink label="With icon" leadingIcon={<SparkleIcon size={16} />} onPress={noop} />
      </View>
      <SectionTitle title="LoadingButton" style={{ marginTop: 16 }} />
      <LoadingButton label="Submit" variant="primary" expanded isLoading={loading} onPress={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }} />
    </View>
  );
}

/* ━━━ 8 · BADGES ━━━ */
function BadgesSection() {
  return (
    <View>
      <SectionTitle title="Badge" secondary="5 colors" />
      <View style={ss.badgeRow}>
        <Badge label="Accent" color="accent" />
        <Badge label="Neutral" color="neutral" />
        <Badge label="Success" color="success" />
        <Badge label="Attention" color="attention" />
        <Badge label="Critical" color="critical" />
      </View>
    </View>
  );
}

/* ━━━ 9 · AVATAR ━━━ */
function AvatarSection() {
  const t = useNuDSTheme();
  return (
    <View>
      <SectionTitle title="Avatar & AvatarGroup" />
      <View style={ss.row}>
        <Avatar variant="icon" size="large" icon={<UserIcon size={28} color={t.color.content.main} />} />
        <Avatar variant="initials" size="large" initials="JF" />
        <Avatar variant="initials" size="medium" initials="NU" />
        <Avatar variant="icon" size="small" icon={<NuLogoIcon size={16} color={t.color.content.main} />} />
      </View>
      <NText variant="labelSmallStrong" style={ss.subHeading}>AvatarGroup</NText>
      <AvatarGroup size="medium">
        <Avatar variant="initials" initials="AB" />
        <Avatar variant="initials" initials="CD" />
        <Avatar variant="initials" initials="EF" />
      </AvatarGroup>
    </View>
  );
}

/* ━━━ 10 · TOP BAR VARIANTS ━━━ */
function TopBarSection() {
  return (
    <View>
      <SectionTitle title="TopBar" secondary="4 variants" />
      <View style={ss.gap12}>
        <Box surface="primary" style={ss.topBarDemo}><TopBar title="Default" variant="default" /></Box>
        <Box surface="primary" style={ss.topBarDemo}><TopBar title="Modal" variant="modal" onPressLeading={noop} /></Box>
        <Box surface="primary" style={ss.topBarDemo}><TopBar title="Dropdown" subtitle="Select option" variant="dropdown" onDropdownPress={noop} /></Box>
      </View>
    </View>
  );
}

/* ━━━ 11 · LIST ROW & SECTION ━━━ */
function ListSectionDemo() {
  const t = useNuDSTheme();
  return (
    <View>
      <SectionTitle title="ListRow & ListSection" />
      <ListSection sectionTitle="Account">
        <ListRow label="Pix" description="Transfer instantly" leading={<PixIcon size={24} color={t.color.main} />} showChevron showDivider onPress={alert('Pix')} />
        <ListRow label="Cards" description="Manage your cards" leading={<CardIcon size={24} color={t.color.main} />} showChevron showDivider onPress={alert('Cards')} />
        <ListRow label="Notifications" description="Push & alerts" leading={<BellIcon size={24} color={t.color.main} />} trailing={<Badge label="3" color="accent" />} showDivider onPress={alert('Notif')} />
        <ListRow label="Settings" description="App preferences" leading={<SettingsIcon size={24} color={t.color.content.secondary} />} showChevron onPress={alert('Settings')} />
      </ListSection>
    </View>
  );
}

/* ━━━ 12 · CALLOUT BOX ━━━ */
function CalloutSection() {
  return (
    <View>
      <SectionTitle title="CalloutBox" secondary="2 tones" />
      <View style={ss.gap12}>
        <CalloutBox title="Welcome to NuDS" description="Neutral callout with action." tone="neutral" actionLabel="Learn more" onActionPress={alert('Neutral callout')} />
        <CalloutBox title="New feature" description="Accent variant for emphasis." tone="accent" actionLabel="Try now" onActionPress={alert('Accent callout')} />
      </View>
    </View>
  );
}

/* ━━━ 13 · BOTTOM BAR ━━━ */
function BottomBarSection() {
  return (
    <View>
      <SectionTitle title="BottomBar" secondary="vertical & horizontal" />
      <Box surface="secondary" style={ss.bottomBarDemo}>
        <BottomBar primaryLabel="Continue" secondaryLabel="Go back" orientation="vertical" onPrimaryPress={noop} onSecondaryPress={noop} />
      </Box>
    </View>
  );
}

/* ━━━ 14 · BOTTOM SHEET ━━━ */
function BottomSheetSection() {
  const [vis, setVis] = useState(false);
  return (
    <View>
      <SectionTitle title="BottomSheet" />
      <Button label="Open BottomSheet" variant="secondary" expanded onPress={() => setVis(true)} />
      <BottomSheet visible={vis} onClose={() => setVis(false)} title="Example Sheet" showHandle>
        <View style={{ padding: 20 }}>
          <NText variant="paragraphMediumDefault">This is a NuDS BottomSheet with handle and title.</NText>
          <View style={{ height: 16 }} />
          <Button label="Close" variant="primary" expanded onPress={() => setVis(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}

/* ━━━ 15 · CIRCULAR LOADER ━━━ */
function LoaderSection() {
  return (
    <View>
      <SectionTitle title="CircularLoader" />
      <View style={ss.row}>
        <CircularLoader size="small" />
        <CircularLoader size="large" />
      </View>
    </View>
  );
}

/* ━━━ 16 · DATA SELECT ━━━ */
function DataSelectSection() {
  const [val, setVal] = useState<string | number | undefined>('3');
  return (
    <View>
      <SectionTitle title="DataSelect" />
      <DataSelect
        items={[{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }]}
        selectedValue={val}
        onSelect={setVal}
        columns={5}
      />
    </View>
  );
}

/* ━━━ 17 · FILTER BAR ━━━ */
function FilterBarSection() {
  return (
    <View>
      <SectionTitle title="FilterBar" />
      <FilterBar
        filters={[
          { key: 'all', label: 'All', selected: true },
          { key: 'income', label: 'Income' },
          { key: 'expense', label: 'Expense' },
          { key: 'pix', label: 'Pix' },
        ]}
        onFilterPress={noop}
      />
    </View>
  );
}

/* ━━━ 18 · HEADER ━━━ */
function HeaderSection() {
  return (
    <View>
      <SectionTitle title="Header" secondary="standard" />
      <Box surface="primary" style={ss.headerDemo}>
        <Header type="standard" title="Account Overview" subtitle="Your finances at a glance" showSubtitle />
      </Box>
    </View>
  );
}

/* ━━━ 19 · INLINE ACTIONS ━━━ */
function InlineActionsSection() {
  const t = useNuDSTheme();
  return (
    <View>
      <SectionTitle title="InlineActions" />
      <InlineActions
        actions={[
          { key: 'pix', label: 'Pix', icon: <PixIcon size={24} color={t.color.main} />, onPress: noop },
          { key: 'transfer', label: 'Transfer', icon: <MoneyOutIcon size={24} color={t.color.main} />, onPress: noop },
          { key: 'deposit', label: 'Deposit', icon: <MoneyInIcon size={24} color={t.color.main} />, onPress: noop },
        ]}
      />
    </View>
  );
}

/* ━━━ 20 · TEXT FIELD ━━━ */
function TextFieldSection() {
  const [text, setText] = useState('');
  return (
    <View>
      <SectionTitle title="TextField" />
      <View style={ss.gap12}>
        <TextField label="Name" type="regular" value={text} onChangeText={setText} />
        <TextField label="Amount" type="regular" leadingValue="R$" value="150,00" />
        <TextField label="Error example" type="regular" error="This field is required" value="" />
      </View>
    </View>
  );
}

/* ━━━ 21 · TOOLTIP ━━━ */
function TooltipSection() {
  return (
    <View>
      <SectionTitle title="Tooltip" />
      <View style={{ height: 60, justifyContent: 'flex-end' }}>
        <Tooltip label="This is a tooltip" arrowPosition="bottomCenter" visible />
      </View>
    </View>
  );
}

/* ━━━ 22 · TRANSACTION LIST ROW ━━━ */
function TransactionSection() {
  return (
    <View>
      <SectionTitle title="TransactionListRow" />
      <TransactionListRow label="Spotify" description="Subscription" amount="29.90" amountPrefix="R$" showDivider onPress={noop} />
      <TransactionListRow label="Salary" description="Company Inc." amount="8,500.00" amountPrefix="R$" variant="success" showDivider onPress={noop} />
      <TransactionListRow label="Transfer" description="John Doe" amount="200.00" amountPrefix="R$" variant="default" onPress={noop} />
    </View>
  );
}

/* ━━━ 23 · DIVIDER ━━━ */
function DividerSection() {
  return (
    <View>
      <SectionTitle title="Divider" secondary="2 sizes" />
      <NText variant="labelSmallDefault" tone="secondary" style={{ marginBottom: 8 }}>Default</NText>
      <Divider />
      <NText variant="labelSmallDefault" tone="secondary" style={{ marginTop: 12, marginBottom: 8 }}>Medium</NText>
      <Divider size="medium" />
    </View>
  );
}

/* ━━━ 24 · ACTION SHEET (pattern) ━━━ */
function ActionSheetSection() {
  const [vis, setVis] = useState(false);
  return (
    <View>
      <SectionTitle title="ActionSheet" secondary="pattern" />
      <Button label="Open ActionSheet" variant="secondary" expanded onPress={() => setVis(true)} />
      <ActionSheet
        visible={vis}
        onClose={() => setVis(false)}
        title="Choose action"
        actions={[
          { key: 'share', label: 'Share', icon: <ShareIosIcon size={20} />, onPress: () => setVis(false) },
          { key: 'copy', label: 'Copy', icon: <CopyIcon size={20} />, onPress: () => setVis(false) },
          { key: 'delete', label: 'Delete', icon: <TrashIcon size={20} />, onPress: () => setVis(false) },
        ]}
      />
    </View>
  );
}

/* ━━━ 25 · DASHBOARD HERO (pattern) ━━━ */
function DashboardHeroSection() {
  return (
    <View>
      <SectionTitle title="DashboardHero" secondary="pattern" />
      <Box surface="primary" style={ss.patternBox}>
        <DashboardHero balance="R$ 4.231,89" dueDate="Mar 15" showAutopay autopayDate="Mar 10" autopayStatus="success" />
      </Box>
    </View>
  );
}

/* ━━━ 26 · LIMIT BAR (pattern) ━━━ */
function LimitBarSection() {
  return (
    <View>
      <SectionTitle title="LimitBar" secondary="pattern" />
      <Box surface="primary" style={ss.patternBox}>
        <LimitBar availableAmount={7500} totalLimit={12000} label="Available limit" />
      </Box>
    </View>
  );
}

/* ━━━ 27 · WIDGET 2x2 (pattern) ━━━ */
function Widget2x2Section() {
  return (
    <View>
      <SectionTitle title="Widget2x2" secondary="pattern" />
      <View style={ss.row}>
        <Widget2x2 variant="default" overline="Savings" title="R$ 1.250" description="+2.3%" descriptionVariant="success" />
        <Widget2x2 variant="button" overline="Invest" title="See options" buttonLabel="Start" onButtonPress={noop} />
      </View>
    </View>
  );
}

/* ━━━ 28 · WIDGET 4xN (pattern) ━━━ */
function Widget4xNSection() {
  return (
    <View>
      <SectionTitle title="Widget4xN" secondary="pattern" />
      <Widget4xN variant="default" overline="Credit Card" title="R$ 2.456,78" description="Due Mar 15" />
      <View style={{ height: 12 }} />
      <Widget4xN variant="determinate" overline="Goal" title="New Car" progress={0.65} progressLabel="65% complete" />
    </View>
  );
}

/* ━━━ 29 · ICONS GRID ━━━ */
const ALL_ICONS = [
  { C: NuLogoIcon, n: 'NuLogo' }, { C: CheckCircleIcon, n: 'CheckCircle' }, { C: InfoIcon, n: 'Info' },
  { C: SettingsIcon, n: 'Settings' }, { C: StarIcon, n: 'Star' }, { C: CardIcon, n: 'Card' },
  { C: PixIcon, n: 'Pix' }, { C: BellIcon, n: 'Bell' }, { C: HeartIcon, n: 'Heart' },
  { C: SparkleIcon, n: 'Sparkle' }, { C: SearchIcon, n: 'Search' }, { C: CloseIcon, n: 'Close' },
  { C: AddIcon, n: 'Add' }, { C: TrashIcon, n: 'Trash' }, { C: DownloadIcon, n: 'Download' },
  { C: ShareIosIcon, n: 'Share' }, { C: UserIcon, n: 'User' }, { C: WalletIcon, n: 'Wallet' },
  { C: MoneyInIcon, n: 'MoneyIn' }, { C: MoneyOutIcon, n: 'MoneyOut' }, { C: CalendarIcon, n: 'Calendar' },
  { C: LockIcon, n: 'Lock' }, { C: ShieldCheckIcon, n: 'ShieldCheck' }, { C: BankIcon, n: 'Bank' },
  { C: ReceiptIcon, n: 'Receipt' }, { C: HistoryIcon, n: 'History' }, { C: HelpIcon, n: 'Help' },
  { C: CopyIcon, n: 'Copy' }, { C: PencilIcon, n: 'Pencil' }, { C: GlobeIcon, n: 'Globe' },
  { C: ChevronIcon, n: 'Chevron' }, { C: WarningIcon, n: 'Warning' }, { C: CheckIcon, n: 'Check' },
  { C: ArrowRightIcon, n: 'ArrowRight' }, { C: HomeTemporaryIcon, n: 'Home' },
  { C: ShoppingCartIcon, n: 'Cart' }, { C: CashbackIcon, n: 'Cashback' }, { C: GiftCardsIcon, n: 'Gift' },
  { C: FireIcon, n: 'Fire' }, { C: TrophyIcon, n: 'Trophy' }, { C: RibbonIcon, n: 'Ribbon' },
  { C: TargetIcon, n: 'Target' }, { C: BoltIcon, n: 'Bolt' }, { C: SunIcon, n: 'Sun' },
  { C: MoonIcon, n: 'Moon' },
];

function IconsSection() {
  const t = useNuDSTheme();
  const [filter, setFilter] = useState('');
  const filtered = filter ? ALL_ICONS.filter((i) => i.n.toLowerCase().includes(filter.toLowerCase())) : ALL_ICONS;
  return (
    <View>
      <SectionTitle title="Icons" secondary={`${ALL_ICONS.length} shown of 268`} />
      <View style={ss.iconSearch}>
        <SearchIcon size={16} color={t.color.content.secondary} />
        <RNTextInput
          style={[ss.iconSearchInput, { color: t.color.content.primary }]}
          placeholder="Filter icons..."
          placeholderTextColor={t.color.content.secondary}
          value={filter}
          onChangeText={setFilter}
        />
      </View>
      <View style={ss.iconGrid}>
        {filtered.map(({ C, n }) => (
          <View key={n} style={ss.iconItem}>
            <C size={24} color={t.color.content.primary} />
            <NText variant="label2XSmallDefault" tone="secondary">{n}</NText>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ━━━ 30 · INTERACTIVE TEMPLATES ━━━ */
function InteractiveTemplates() {
  const t = useNuDSTheme();
  const [showSheet, setShowSheet] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showCrossSell, setShowCrossSell] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [pinValue, setPinValue] = useState('');
  const [selectValue, setSelectValue] = useState<string | undefined>();
  const [dateMonth, setDateMonth] = useState(new Date());

  return (
    <View>
      <SectionTitle title="Interactive Templates" secondary="tap to preview" />
      <NText variant="paragraphSmallDefault" tone="secondary" style={ss.desc}>
        Full previews of complex NuDS components. Tap any row to open.
      </NText>

      <ListSection>
        <ListRow
          label="BottomSheet"
          description="Modal sheet with handle, title and content"
          leading={<ExpandMoreIcon size={24} color={t.color.main} />}
          showChevron
          showDivider
          onPress={() => setShowSheet(true)}
        />
        <ListRow
          label="ActionSheet"
          description="Bottom action list with icons"
          leading={<ListIcon size={24} color={t.color.main} />}
          showChevron
          showDivider
          onPress={() => setShowActions(true)}
        />
        <ListRow
          label="DatePicker"
          description="Calendar month view with selection"
          leading={<CalendarIcon size={24} color={t.color.main} />}
          showChevron
          showDivider
          onPress={() => setShowDatePicker(true)}
        />
        <ListRow
          label="PinChallenge"
          description="Full-screen PIN entry for auth"
          leading={<LockIcon size={24} color={t.color.main} />}
          showChevron
          showDivider
          onPress={() => setShowPin(true)}
        />
        <ListRow
          label="Select"
          description="Dropdown field with options"
          leading={<ChevronIcon size={24} color={t.color.main} />}
          showChevron
          showDivider
          onPress={() => setShowSelect(true)}
        />
        <ListRow
          label="TransactionWidget"
          description="Transaction list card with empty state"
          leading={<ReceiptIcon size={24} color={t.color.main} />}
          showChevron
          showDivider
          onPress={() => setShowTransactions(true)}
        />
        <ListRow
          label="CrossSellCarousel"
          description="Horizontal offer banners"
          leading={<GiftCardsIcon size={24} color={t.color.main} />}
          showChevron
          onPress={() => setShowCrossSell(true)}
        />
      </ListSection>

      {/* ── BottomSheet template ── */}
      <BottomSheet visible={showSheet} onClose={() => setShowSheet(false)} title="Payment Options" showHandle>
        <View style={{ padding: 20, gap: 12 }}>
          <ListRow label="Pix" description="Instant transfer" leading={<PixIcon size={24} color={t.color.main} />} showChevron showDivider onPress={() => setShowSheet(false)} />
          <ListRow label="Credit Card" description="Up to 12x" leading={<CardIcon size={24} color={t.color.main} />} showChevron showDivider onPress={() => setShowSheet(false)} />
          <ListRow label="Bank Transfer" description="1-2 business days" leading={<BankIcon size={24} color={t.color.main} />} showChevron onPress={() => setShowSheet(false)} />
          <View style={{ height: 12 }} />
          <Button label="Close" variant="secondary" expanded onPress={() => setShowSheet(false)} />
        </View>
      </BottomSheet>

      {/* ── ActionSheet template ── */}
      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        title="Transaction Actions"
        actions={[
          { key: 'share', label: 'Share receipt', icon: <ShareIosIcon size={20} />, onPress: () => setShowActions(false) },
          { key: 'copy', label: 'Copy details', icon: <CopyIcon size={20} />, onPress: () => setShowActions(false) },
          { key: 'download', label: 'Download PDF', icon: <DownloadIcon size={20} />, onPress: () => setShowActions(false) },
          { key: 'help', label: 'Report a problem', icon: <HelpIcon size={20} />, onPress: () => setShowActions(false) },
          { key: 'delete', label: 'Delete', icon: <TrashIcon size={20} />, onPress: () => setShowActions(false) },
        ]}
      />

      {/* ── DatePicker template (in BottomSheet) ── */}
      <BottomSheet visible={showDatePicker} onClose={() => setShowDatePicker(false)} title="Select Date" showHandle>
        <View style={{ padding: 20 }}>
          <DatePicker
            month={dateMonth}
            selectedDate={selectedDate}
            onSelectDate={(d) => { setSelectedDate(d); setTimeout(() => setShowDatePicker(false), 400); }}
            onPreviousMonth={() => setDateMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            onNextMonth={() => setDateMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            showHeader
            showWeekdays
          />
        </View>
      </BottomSheet>

      {/* ── PinChallenge template ── */}
      <PinChallenge
        visible={showPin}
        onClose={() => { setShowPin(false); setPinValue(''); }}
        onComplete={() => { setShowPin(false); setPinValue(''); Alert.alert('NuDS', 'PIN entered successfully'); }}
        title="Enter your PIN"
        length={4}
      />

      {/* ── Select template (in BottomSheet) ── */}
      <BottomSheet visible={showSelect} onClose={() => setShowSelect(false)} title="Choose Account" showHandle>
        <View style={{ padding: 20, gap: 16 }}>
          <Select
            label="Account type"
            placeholder="Select an option"
            value={selectValue}
            options={[
              { label: 'Checking Account', value: 'checking' },
              { label: 'Savings Account', value: 'savings' },
              { label: 'Investment Account', value: 'invest' },
            ]}
          />
          <Button label="Confirm" variant="primary" expanded onPress={() => setShowSelect(false)} />
        </View>
      </BottomSheet>

      {/* ── TransactionWidget template (in BottomSheet) ── */}
      <BottomSheet visible={showTransactions} onClose={() => setShowTransactions(false)} title="Recent Transactions" showHandle>
        <View style={{ padding: 20 }}>
          <TransactionWidget
            title="This week"
            transactions={[
              { key: 'spotify', label: 'Spotify', description: 'Subscription', amount: 'R$ 29,90' },
              { key: 'uber', label: 'Uber', description: 'Transportation', amount: 'R$ 18,50' },
              { key: 'salary', label: 'Salary', description: 'Company Inc.', amount: 'R$ 8.500,00' },
            ]}
            showButton
            buttonLabel="See all"
            onButtonPress={() => setShowTransactions(false)}
          />
        </View>
      </BottomSheet>

      {/* ── CrossSellCarousel template (in BottomSheet) ── */}
      <BottomSheet visible={showCrossSell} onClose={() => setShowCrossSell(false)} title="Offers for you" showHandle>
        <View style={{ padding: 20 }}>
          <CrossSellCarousel
            sectionTitle="Recommended"
            items={[
              { key: '1', text: 'Nu Invest', description: 'Start investing today', onPress: () => {} },
              { key: '2', text: 'Nu Insurance', description: 'Protect what matters', onPress: () => {} },
              { key: '3', text: 'Nu Shopping', description: 'Cashback on purchases', onPress: () => {} },
            ]}
            colorScheme="01"
          />
          <View style={{ height: 16 }} />
          <Button label="Close" variant="secondary" expanded onPress={() => setShowCrossSell(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}

/* ━━━ THEME TOGGLE ━━━ */
function ThemeToggle() {
  const { mode, toggle } = useThemeMode();
  const t = useNuDSTheme();
  const isDark = mode === 'dark';
  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.7}
      style={[ss.toggleCard, {
        backgroundColor: isDark ? t.color.content.primary : t.color.background.secondary,
        borderColor: isDark ? t.color.main : t.color.border.primary,
      }]}
    >
      <View style={ss.toggleLeft}>
        {isDark ? <MoonIcon size={20} color={t.color.content.main} /> : <SunIcon size={20} color={t.color.main} />}
        <View>
          <NText variant="labelSmallStrong" color={isDark ? t.color.content.main : t.color.content.primary}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </NText>
          <NText variant="label2XSmallDefault" color={isDark ? t.color.content.main : t.color.content.secondary}>
            Toggle to see what adapts via NuDS tokens
          </NText>
        </View>
      </View>
      <View style={[ss.toggleTrack, { backgroundColor: isDark ? t.color.main : t.color.border.secondary }]}>
        <View style={[ss.toggleThumb, isDark ? ss.toggleThumbOn : ss.toggleThumbOff, { backgroundColor: t.color.background.primary }]} />
      </View>
    </TouchableOpacity>
  );
}

/* ━━━ MAIN SCREEN ━━━ */
export default function NuDSCheckScreen({ onBack }: Props) {
  const t = useNuDSTheme();
  const { mode, toggle } = useThemeMode();
  return (
    <View style={[ss.screen, { backgroundColor: t.color.background.primary }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <TopBar
        title="NuDS Showcase"
        variant="default"
        leading={<ArrowBackIcon size={24} color={t.color.content.primary} />}
        onPressLeading={onBack}
        trailing={
          <TouchableOpacity onPress={toggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {mode === 'dark' ? <SunIcon size={24} color={t.color.content.primary} /> : <MoonIcon size={24} color={t.color.content.primary} />}
          </TouchableOpacity>
        }
      />
      <ScrollView style={ss.scroll} contentContainerStyle={ss.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemeToggle />
        <NText variant="titleLarge" style={ss.pageTitle}>Design System Showcase</NText>
        <NText variant="paragraphMediumDefault" tone="secondary" style={ss.pageSubtitle}>
          NuDS v0.4.1 — 4 primitives, 26 components, 8 patterns, 268 icons, 7 token categories.
        </NText>

        {/* ── INTERACTIVE TEMPLATES ── */}
        <InteractiveTemplates />
        <Divider size="medium" style={ss.groupDiv} />

        {/* ── TOKENS ── */}
        <NText variant="titleSmall" style={ss.groupTitle}>Tokens</NText>
        <ColorTokensSection />
        <Divider style={ss.div} />
        <SpacingSection />
        <Divider style={ss.div} />
        <RadiusSection />
        <Divider style={ss.div} />
        <ElevationSection />
        <Divider style={ss.div} />
        <TypographySection />

        {/* ── PRIMITIVES ── */}
        <Divider size="medium" style={ss.groupDiv} />
        <NText variant="titleSmall" style={ss.groupTitle}>Primitives</NText>
        <PrimitivesSection />
        <Divider style={ss.div} />
        <DividerSection />

        {/* ── COMPONENTS ── */}
        <Divider size="medium" style={ss.groupDiv} />
        <NText variant="titleSmall" style={ss.groupTitle}>Components</NText>
        <ButtonsSection />
        <Divider style={ss.div} />
        <BadgesSection />
        <Divider style={ss.div} />
        <AvatarSection />
        <Divider style={ss.div} />
        <TopBarSection />
        <Divider style={ss.div} />
        <ListSectionDemo />
        <Divider style={ss.div} />
        <CalloutSection />
        <Divider style={ss.div} />
        <BottomBarSection />
        <Divider style={ss.div} />
        <BottomSheetSection />
        <Divider style={ss.div} />
        <LoaderSection />
        <Divider style={ss.div} />
        <DataSelectSection />
        <Divider style={ss.div} />
        <FilterBarSection />
        <Divider style={ss.div} />
        <HeaderSection />
        <Divider style={ss.div} />
        <InlineActionsSection />
        <Divider style={ss.div} />
        <TextFieldSection />
        <Divider style={ss.div} />
        <TooltipSection />
        <Divider style={ss.div} />
        <TransactionSection />

        {/* ── PATTERNS ── */}
        <Divider size="medium" style={ss.groupDiv} />
        <NText variant="titleSmall" style={ss.groupTitle}>Patterns</NText>
        <ActionSheetSection />
        <Divider style={ss.div} />
        <DashboardHeroSection />
        <Divider style={ss.div} />
        <LimitBarSection />
        <Divider style={ss.div} />
        <Widget2x2Section />
        <Divider style={ss.div} />
        <Widget4xNSection />

        {/* ── ICONS ── */}
        <Divider size="medium" style={ss.groupDiv} />
        <NText variant="titleSmall" style={ss.groupTitle}>Icons</NText>
        <IconsSection />

        <View style={{ height: 120 }} />
      </ScrollView>
      <CheckoutBottomBar primaryText="NuDS integrated" secondaryText="All components loaded" buttonLabel="Done" onButtonPress={onBack} />
    </View>
  );
}

/* ━━━ STYLES ━━━ */
const ss = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 34 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { marginBottom: 4 },
  pageSubtitle: { marginBottom: 24 },
  groupTitle: { marginBottom: 16, marginTop: 8 },
  groupDiv: { marginVertical: 32 },
  div: { marginVertical: 20 },
  desc: { marginBottom: 12 },
  subHeading: { marginTop: 12, marginBottom: 8 },

  tokenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  tokenItem: { alignItems: 'center', width: 76, gap: 4 },
  colorSwatch: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },

  spacingRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  spacingItem: { alignItems: 'center', gap: 4 },

  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  radiusItem: { alignItems: 'center', gap: 4 },

  elevationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  elevationCard: { width: 80, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  typographyBox: { padding: 16, borderRadius: 16, marginTop: 8, gap: 4 },

  boxRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  boxDemo: { flex: 1, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  tonesBox: { padding: 12, borderRadius: 12, gap: 6, marginTop: 4 },

  gap12: { gap: 12, marginTop: 8 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },

  topBarDemo: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  bottomBarDemo: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  headerDemo: { borderRadius: 12, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  patternBox: { borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },

  iconSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 10, paddingHorizontal: 12, height: 40, marginBottom: 12 },
  iconSearchInput: { flex: 1, fontSize: 14, padding: 0 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  iconItem: { alignItems: 'center', width: 56, gap: 4 },

  toggleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleTrack: { width: 48, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 3 },
  toggleThumb: { width: 22, height: 22, borderRadius: 11 },
  toggleThumbOff: { alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },
});
