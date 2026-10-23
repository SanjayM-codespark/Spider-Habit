import { Platform } from 'react-native';
import InAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import { logger } from '../utils/logger';

const TAG = 'AppUpdateService';

const inAppUpdates = new InAppUpdates(false);

let updateInProgress = false;

/**
 * Forces the user onto the latest Play Store version.
 *
 * Uses Google Play's IMMEDIATE in-app update flow: a full-screen blocking
 * prompt that downloads and installs the new version, and the app cannot be
 * used until it finishes. Only works for builds installed from the Play Store;
 * sideloaded/debug builds simply report "no update" (errors are swallowed so
 * a failed check never blocks the app).
 */
export const checkForForcedUpdate = async (): Promise<void> => {
  if (Platform.OS !== 'android' || updateInProgress) return;

  try {
    // The native check only reports AVAILABLE when Play has a newer
    // versionCode, so any AVAILABLE result is an update to force.
    const result = await inAppUpdates.checkNeedsUpdate({
      customVersionComparator: () => 1,
    });

    if (!result.shouldUpdate) {
      logger.info(TAG, 'App is up to date');
      return;
    }

    logger.info(TAG, 'Newer Play Store version found, starting forced update', {
      storeVersion: result.storeVersion,
    });
    updateInProgress = true;
    await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
  } catch (error) {
    logger.warn(TAG, 'Update check failed, continuing', error);
  } finally {
    updateInProgress = false;
  }
};
