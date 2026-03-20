import React from 'react';
import { View, FlatList, Pressable, Platform, Dimensions, StyleSheet } from 'react-native';
import {
  BottomSheet,
  Badge,
  NText,
  ChevronIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import { getUseCaseForLocale, generateInstallmentList } from '../config/useCases';
import { formatCurrency, interpolate } from '../config/formatters';

const SCREEN_H = Dimensions.get('window').height;

type InstallmentItem = {
  id: string;
  installments: string;
  discount: string;
  total: string;
  recommended: boolean;
};

function buildInstallmentItems(locale: Locale): InstallmentItem[] {
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);
  const list = generateInstallmentList(useCase.debt);
  const t = useTranslation(locale);
  const sg = t.suggested;

  return list.map((item) => {
    const installments = item.count === 1
      ? interpolate(sg.installmentOf, { amount: fmtAmount(item.amount) })
      : interpolate(sg.installmentsOf, { count: String(item.count), amount: fmtAmount(item.amount) });
    const discount = interpolate(sg.discountAmount, { amount: fmtAmount(item.discount) });
    const total = interpolate(sg.totalLabel, { amount: fmtAmount(item.total) });

    return { id: String(item.count), installments, discount, total, recommended: item.recommended };
  });
}

function InstallmentRow({
  item,
  showDivider,
  recommendedLabel,
}: {
  item: InstallmentItem;
  showDivider: boolean;
  recommendedLabel: string;
}) {
  const theme = useNuDSTheme();

  return (
    <View style={{ width: '100%', position: 'relative' }}>
      <Pressable
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          gap: 12,
          backgroundColor: pressed ? theme.color.background.secondaryFeedback : 'transparent',
        })}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <NText variant="labelSmallStrong">{item.installments}</NText>
          <NText variant="paragraphSmallDefault" tone="positive">{item.discount}</NText>
          <NText variant="paragraphSmallDefault" tone="secondary">{item.total}</NText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {item.recommended && (
            <Badge label={recommendedLabel} color="accent" />
          )}
          {!item.recommended && (
            <View style={{ transform: [{ rotate: '-90deg' }] }}>
              <ChevronIcon size={20} color={theme.color.content.primary} />
            </View>
          )}
        </View>
      </Pressable>
      {showDivider && (
        <View style={{ position: 'absolute', bottom: 0, left: 16, right: 16 }}>
          <View style={{ height: 1, backgroundColor: theme.color.border.secondary }} />
        </View>
      )}
    </View>
  );
}

export default function InstallmentListModal({
  locale = 'pt-BR',
  visible,
  onClose,
}: {
  locale?: Locale;
  visible: boolean;
  onClose: () => void;
}) {
  const t = useTranslation(locale);
  const data = buildInstallmentItems(locale);

  const renderItem = ({ item, index }: { item: InstallmentItem; index: number }) => (
    <InstallmentRow
      item={item}
      showDivider={index < data.length - 1}
      recommendedLabel={t.installmentList.recommendedLabel}
    />
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t.installmentList.title}
      showHandle
      show1stAction={false}
      show2ndAction={false}
      style={{ maxHeight: SCREEN_H * 0.85 }}
    >
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
});
