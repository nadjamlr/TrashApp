import React from 'react';
import { StyleSheet } from 'react-native';

import { ExternalLink } from './ExternalLink';
import { MonoText } from './StyledText';
import { Text, View } from './Themed';

import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View>
      <View style={styles.getStartedContainer}>
        <Text style={styles.getStartedText} colorName="muted">
          Open up the code for this screen:
        </Text>

        <View
          style={[styles.codeHighlightContainer, styles.homeScreenFilename]}
          colorName="codeBackground">
          <MonoText>{path}</MonoText>
        </View>

        <Text style={styles.getStartedText} colorName="muted">
          Change any of the text, save the file, and your app will automatically update.
        </Text>
      </View>

      <View style={styles.helpContainer}>
        <ExternalLink
          style={styles.helpLink}
          href="https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet">
          <Text style={styles.helpLinkText} lightColor={Colors.light.tint} darkColor={Colors.dark.tint}>
            Tap here if your app doesn't automatically update after making changes
          </Text>
        </ExternalLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: Spacing.xxl,
  },
  homeScreenFilename: {
    marginVertical: Spacing.sm,
  },
  codeHighlightContainer: {
    borderRadius: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  getStartedText: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: Spacing.md,
  },
  helpLinkText: {
    textAlign: 'center',
  },
});
