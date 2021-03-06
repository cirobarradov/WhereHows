import Controller from '@ember/controller';
import { computed, set, get, setProperties, getWithDefault } from '@ember/object';
import ComputedProperty from '@ember/object/computed';
import { or } from '@ember/object/computed';
import { encodeUrn } from 'wherehows-web/utils/validators/urn';
import { Tabs } from 'wherehows-web/constants/datasets/shared';
import { action } from '@ember-decorators/object';
import { DatasetPlatform } from 'wherehows-web/constants';
import { IDatasetView } from 'wherehows-web/typings/api/datasets/dataset';

export default class DatasetController extends Controller {
  queryParams = ['urn'];
  /**
   * References the controller model
   * @type {IDatasetView}
   * @memberof DatasetController
   */
  model: IDatasetView | void;

  /**
   * URN for the current dataset view
   * @type {(string | void)}
   * @memberof DatasetController
   */
  urn: string | void;

  /**
   * Enum of tab properties
   * @type {Tabs}
   * @memberof DatasetController
   */
  tabIds = Tabs;

  /**
   * The currently selected tab in view
   * @type {Tabs}
   * @memberof DatasetController
   */
  tabSelected: Tabs;

  /**
   * Flag indicating if the compliance info does not have user entered information
   * @type {boolean}
   * @memberof DatasetController
   */
  isNewComplianceInfo: boolean;

  /**
   * Flag indicating is there are suggestions that have not been accepted or ignored
   * @type {boolean}
   * @memberof DatasetController
   */
  hasSuggestions: boolean;

  /**
   * Flag indicating there are fields in the compliance policy that have not been updated by a user
   * @type {boolean}
   * @memberof DatasetController
   */
  compliancePolicyHasDrift: boolean;

  /**
   * Contains a list of whitelisted dataset platforms for JIT ACL access
   * @type {Array<DatasetPlatform>}
   * @memberof DatasetController
   */
  jitAclAccessWhitelist: Array<DatasetPlatform>;

  /**
   * Flag indicating whether or not to show the ownership revamp tab information
   * @type {string}
   * @memberof DatasetController
   */
  showOwnership: string;

  /**
   * Flag indicating the dataset policy is derived from an upstream source
   * @type {boolean}
   * @memberof DatasetController
   */
  isPolicyFromUpstream = false;

  /**
   * Flag indicating if the viewer is internal
   * @type {boolean}
   * @memberof DatasetController
   */
  isInternal: boolean;

  /**
   * Flag indicating that the compliance policy needs user attention
   * @type {ComputedProperty<boolean>}
   */
  requiresUserAction: ComputedProperty<boolean> = or(
    'isNewComplianceInfo',
    'hasSuggestions',
    'compliancePolicyHasDrift'
  );

  /**
   * Converts the uri on a model to a usable URN format
   * @type {ComputedProperty<string>}
   */
  encodedUrn: ComputedProperty<string> = computed('model', function(this: DatasetController): string {
    const { uri } = get(this, 'model') || { uri: '' };
    return encodeUrn(uri);
  });

  /**
   * Checks if the current platform exists in the supported list of JIT ACL whitelisted platforms
   * @type {ComputedProperty<boolean>}
   */
  isJitAclAccessEnabled: ComputedProperty<boolean> = computed('jitAclAccessWhitelist', function(
    this: DatasetController
  ): boolean {
    const jitAclAccessWhitelist = getWithDefault(this, 'jitAclAccessWhitelist', []);
    const { platform } = get(this, 'model') || { platform: '' };

    return !!platform && jitAclAccessWhitelist.includes(<DatasetPlatform>platform);
  });

  /**
   * Creates an instance of DatasetController.
   * @memberof DatasetController
   */
  constructor() {
    super(...arguments);
    this.tabSelected || (this.tabSelected = Tabs.Ownership);
    this.jitAclAccessWhitelist || (this.jitAclAccessWhitelist = []);
  }

  /**
   * Handles user generated tab selection action by transitioning to specified route
   * @param {Tabs} tabSelected the currently selected tab
   * @returns {void}
   * @memberof DatasetController
   */
  @action
  tabSelectionChanged(tabSelected: Tabs): void {
    // if the tab selection is same as current, noop
    return get(this, 'tabSelected') === tabSelected
      ? void 0
      : this.transitionToRoute(`datasets.dataset.${tabSelected}`, get(this, 'encodedUrn'));
  }

  /**
   * Updates the hasSuggestions flag if the policy is not from an upstream dataset, otherwise set to false
   * @param {boolean} hasSuggestions
   * @memberof DatasetController
   */
  @action
  setOnChangeSetChange(hasSuggestions: boolean) {
    const fromUpstream = get(this, 'isPolicyFromUpstream');
    set(this, 'hasSuggestions', !fromUpstream && hasSuggestions);
  }

  /**
   * Updates the isNewComplianceInfo flag if the policy is not from an upstream dataset, otherwise set to false
   * Also sets the isPolicyFromUpstream attribute
   * @param {({
   *     isNewComplianceInfo: boolean;
   *     fromUpstream: boolean;
   *   })} {
   *     isNewComplianceInfo,
   *     fromUpstream
   *   }
   * @memberof DatasetController
   */
  @action
  setOnComplianceTypeChange({
    isNewComplianceInfo,
    fromUpstream
  }: {
    isNewComplianceInfo: boolean;
    fromUpstream: boolean;
  }) {
    setProperties(this, {
      isNewComplianceInfo: !fromUpstream && isNewComplianceInfo,
      isPolicyFromUpstream: fromUpstream
    });

    if (fromUpstream) {
      this.setOnChangeSetChange(false);
      this.setOnChangeSetDrift(false);
    }
  }

  /**
   * Setter to update the drift flag
   * @param {boolean} hasDrift
   * @memberof DatasetController
   */
  @action
  setOnChangeSetDrift(hasDrift: boolean) {
    const fromUpstream = get(this, 'isPolicyFromUpstream');
    set(this, 'compliancePolicyHasDrift', !fromUpstream && hasDrift);
  }
}
