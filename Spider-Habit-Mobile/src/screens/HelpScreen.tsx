import CustomText from '../components/CustomText';
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { TopHeader } from '../components/TopHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getHelpPages, HelpPageSummary } from '../services/helpPageService';

interface Props {
  navigation: any;
}

export const HelpScreen: React.FC<Props> = ({ navigation }) => {
  const [pages, setPages] = useState<HelpPageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPages = useCallback(() => {
    setLoading(true);
    setError('');
    getHelpPages()
      .then(result => setPages(result))
      .catch((err: any) =>
        setError(err?.message || 'Failed to load help articles.'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  return (
    <ScreenContainer backgroundColor="#39C4B6" barStyle="light-content">
      <TopHeader title="HELP & SUPPORT" onBack={() => navigation.goBack()} />

      <View style={styles.mainSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <CustomText style={styles.intro}>
            Select a topic below to read its content.
          </CustomText>

          <View style={styles.listCard}>
            {loading && (
              <View style={styles.stateRow}>
                <ActivityIndicator size="small" color="#0D9488" />
                <CustomText style={styles.stateText}>
                  Loading help articles...
                </CustomText>
              </View>
            )}

            {!loading && error ? (
              <TouchableOpacity
                style={styles.stateRow}
                activeOpacity={0.7}
                onPress={loadPages}
              >
                <CustomText style={styles.errorText}>
                  {error} · Tap to retry
                </CustomText>
              </TouchableOpacity>
            ) : null}

            {!loading && !error && pages.length === 0 && (
              <CustomText style={styles.stateText}>
                No help articles available yet.
              </CustomText>
            )}

            {!loading && pages.map((page, index) => (
              <View key={page.slug}>
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('HelpDetail', {
                      slug: page.slug,
                      title: page.title,
                    })
                  }
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.iconBox}>
                      <CustomText style={styles.iconText}>📄</CustomText>
                    </View>
                    <CustomText style={styles.rowTitle}>{page.title}</CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#0D9488" />
                </TouchableOpacity>

                {index < pages.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

export default HelpScreen;

const styles = StyleSheet.create({
  mainSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  scrollContent: { paddingBottom: 40 },
  intro: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  listCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  stateText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 20, lineHeight: 24 },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
});