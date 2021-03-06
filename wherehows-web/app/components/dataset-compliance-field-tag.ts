import Component from '@ember/component';
import ComputedProperty from '@ember/object/computed';
import { set, get, getProperties, computed } from '@ember/object';
import {
  ComplianceFieldIdValue,
  idTypeTagHasLogicalType,
  isTagIdType,
  NonIdLogicalType
} from 'wherehows-web/constants';
import {
  IComplianceChangeSet,
  IComplianceFieldFormatOption,
  IComplianceFieldIdentifierOption
} from 'wherehows-web/typings/app/dataset-compliance';
import { IComplianceDataType } from 'wherehows-web/typings/api/list/compliance-datatypes';
import { action } from '@ember-decorators/object';
import { IdLogicalType } from 'wherehows-web/constants/datasets/compliance';

/**
 * Defines the object properties for instances of IQuickDesc
 * @interface IQuickDesc
 */
interface IQuickDesc {
  title: string;
  description?: string;
}

export default class DatasetComplianceFieldTag extends Component {
  classNames = ['dataset-compliance-fields__field-tag'];
  /**
   * Describes action interface for `onTagIdentifierTypeChange` action
   * @memberof DatasetComplianceFieldTag
   */
  onTagIdentifierTypeChange: (tag: IComplianceChangeSet, option: { value: ComplianceFieldIdValue | null }) => void;

  /**
   * Describes the parent action interface for `onTagLogicalTypeChange`
   */
  onTagLogicalTypeChange: (tag: IComplianceChangeSet, value: IComplianceChangeSet['logicalType']) => void;

  /**
   * Describes the interface for the parent action `onTagValuePatternChange`
   */
  onTagValuePatternChange: (tag: IComplianceChangeSet, pattern: string) => string | void;

  /**
   * Describes the parent action interface for `onTagOwnerChange`
   */
  onTagOwnerChange: (tag: IComplianceChangeSet, nonOwner: boolean) => void;

  /**
   * References the change set item / tag to be added to the parent field
   * @type {IComplianceChangeSet}
   * @memberof DatasetComplianceFieldTag
   */
  tag: IComplianceChangeSet;

  /**
   * Flag indicating that the parent field has a single tag associated
   * @type {boolean}
   * @memberof DatasetComplianceFieldTag
   */
  parentHasSingleTag: boolean;

  /**
   * Stores the value of error result if the valuePattern is invalid
   * @type {string}
   */
  valuePatternError: string = '';

  /**
   * References the properties to be shown in the field tag description / help
   * window when an item that has quickDesc properties is interacted with
   * @type {IQuickDesc | null}
   * @memberof DatasetComplianceFieldTag
   */
  quickDesc: IQuickDesc | null = null;

  /**
   * Reference to the compliance data types
   * @type {Array<IComplianceDataType>}
   */
  complianceDataTypes: Array<IComplianceDataType>;

  /**
   * Reference to the full list of options for the identifierType tag property IComplianceFieldIdentifierOption
   * @type {Array<IComplianceFieldIdentifierOption>}
   */
  complianceFieldIdDropdownOptions: Array<IComplianceFieldIdentifierOption>;

  /**
   * Build the drop down options available for this tag by filtering out options that are not applicable /available for this tag
   * @type {ComputedProperty<Array<IComplianceFieldIdentifierOption>>}
   * @memberof DatasetComplianceFieldTag
   */
  tagIdOptions = computed('hasSingleTag', function(
    this: DatasetComplianceFieldTag
  ): Array<IComplianceFieldIdentifierOption> {
    const { parentHasSingleTag, complianceFieldIdDropdownOptions: allOptions } = getProperties(this, [
      'parentHasSingleTag',
      'complianceFieldIdDropdownOptions'
    ]);

    if (!parentHasSingleTag) {
      const noneOption = allOptions.findBy('value', ComplianceFieldIdValue.None);
      // if the parent field does not have a single tag, then no field can be tagged as ComplianceFieldIdValue.None
      return allOptions.without(noneOption!);
    }

    return allOptions;
  });

  /**
   * Flag indicating that this tag has an identifier type of idType that is true
   * @type {ComputedProperty<boolean>}
   * @memberof DatasetComplianceFieldTag
   */
  isIdType: ComputedProperty<boolean> = computed('tag.identifierType', 'complianceDataTypes', function(
    this: DatasetComplianceFieldTag
  ): boolean {
    const { tag, complianceDataTypes } = getProperties(this, ['tag', 'complianceDataTypes']);
    return isTagIdType(complianceDataTypes)(tag);
  });

  /**
   * A list of field formats that are determined based on the tag identifierType
   * @type ComputedProperty<Array<IComplianceFieldFormatOption>>
   * @memberof DatasetComplianceFieldTag
   */
  fieldFormats: ComputedProperty<Array<IComplianceFieldFormatOption>> = computed('isIdType', function(
    this: DatasetComplianceFieldTag
  ): Array<IComplianceFieldFormatOption> {
    const identifierType = get(this, 'tag')['identifierType'] || '';
    const { isIdType, complianceDataTypes } = getProperties(this, ['isIdType', 'complianceDataTypes']);
    const complianceDataType = complianceDataTypes.findBy('id', identifierType);
    let fieldFormatOptions: Array<IComplianceFieldFormatOption> = [];

    if (complianceDataType && isIdType) {
      const supportedFieldFormats = complianceDataType.supportedFieldFormats || [];
      return supportedFieldFormats.map(format => ({ value: format, label: format }));
    }

    return fieldFormatOptions;
  });

  /**
   * Determines if the CUSTOM input field should be shown for this row's tag
   * @type {ComputedProperty<boolean>}
   */
  showCustomInput = computed('tag.logicalType', function(this: DatasetComplianceFieldTag): boolean {
    const { logicalType, valuePattern = '' } = get(this, 'tag');

    this.actions.tagValuePatternDidChange.call(this, valuePattern);

    return logicalType === IdLogicalType.Custom;
  });

  /**
   * Checks if the field format / logical type for this tag is missing, if the field is of ID type
   * @type {ComputedProperty<boolean>}
   * @memberof DatasetComplianceFieldTag
   */
  isTagFormatMissing = computed('isIdType', 'tag.logicalType', function(this: DatasetComplianceFieldTag): boolean {
    return get(this, 'isIdType') && !idTypeTagHasLogicalType(get(this, 'tag'));
  });

  /**
   * Applies the argument to the quickDesc property or nullifies
   * it if the argument is not provided
   * @param {DatasetComplianceFieldTag.quickDesc} quickDesc
   * @memberof DatasetComplianceFieldTag
   */
  setQuickDesc(quickDesc: DatasetComplianceFieldTag['quickDesc'] = null) {
    set(this, 'quickDesc', quickDesc);
  }

  /**
   * Sets the value of the pattern error string after p
   * @param {string} errorString
   */
  setPatternErrorString(errorString: string = '') {
    set(this, 'valuePatternError', errorString.replace('SyntaxError: ', ''));
  }

  /**
   * Handles UI changes to the tag identifierType
   * @param {ComplianceFieldIdValue} value
   */
  @action
  tagIdentifierTypeDidChange(this: DatasetComplianceFieldTag, value: ComplianceFieldIdValue) {
    const onTagIdentifierTypeChange = get(this, 'onTagIdentifierTypeChange');

    if (typeof onTagIdentifierTypeChange === 'function') {
      this.setQuickDesc();
      onTagIdentifierTypeChange(get(this, 'tag'), { value });
    }
  }

  /**
   * Handles the updates when the tag's logical type changes on this tag
   * @param {IdLogicalType} value contains the selected drop-down value
   */
  @action
  tagLogicalTypeDidChange(this: DatasetComplianceFieldTag, value: IdLogicalType) {
    const onTagLogicalTypeChange = get(this, 'onTagLogicalTypeChange');

    if (typeof onTagLogicalTypeChange === 'function') {
      onTagLogicalTypeChange(get(this, 'tag'), value);
    }
  }

  /**
   * Handles the nonOwner flag update on the tag
   * @param {boolean} nonOwner
   */
  @action
  tagOwnerDidChange(this: DatasetComplianceFieldTag, nonOwner: boolean) {
    get(this, 'onTagOwnerChange')(get(this, 'tag'), nonOwner);
  }

  /**
   * Invokes the parent action on user input for value pattern
   * If an exception is thrown, valuePatternError is updated with string value
   * @param {string} pattern user input string
   */
  @action
  tagValuePatternDidChange(this: DatasetComplianceFieldTag, pattern: string) {
    try {
      const valuePattern = get(this, 'onTagValuePatternChange')(get(this, 'tag'), pattern);

      if (valuePattern) {
        //clear pattern error
        this.setPatternErrorString();
      }
    } catch (e) {
      this.setPatternErrorString(e.toString());
    }
  }

  /**
   * Sets the quickDesc property when the onmouseenter event is triggered for a
   * field tag
   * @param {ComplianceFieldIdValue | NonIdLogicalType} value
   */
  @action
  onFieldTagIdentifierEnter(
    this: DatasetComplianceFieldTag,
    { value }: { value: ComplianceFieldIdValue | NonIdLogicalType }
  ) {
    const complianceDataType = get(this, 'complianceDataTypes').findBy('id', value);

    if (complianceDataType) {
      const { title, description } = complianceDataType;
      this.setQuickDesc({ title, description });
    }
  }

  /**
   * Clears the quickDesc property when the onmouseeleave event is
   * triggered for a field tag
   */
  @action
  onFieldTagIdentifierLeave(this: DatasetComplianceFieldTag) {
    this.setQuickDesc();
  }
}
