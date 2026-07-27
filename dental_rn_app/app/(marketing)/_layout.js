import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import Nav from '../../src/components/site/Nav';
import Footer from '../../src/components/site/Footer';
import { colors } from '../../src/theme/tokens';

// Shared chrome for every public marketing route: Nav + scrollable page body + Footer.
export default function MarketingLayout() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Nav />
      <Slot />
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
  },
});
