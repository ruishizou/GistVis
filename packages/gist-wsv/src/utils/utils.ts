import { GistvisSpec, InsightType, DataSpec, VIS_INSIGHT_TYPES } from '../components/types';

export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const recommendValidTypes = (gistVisSpec: GistvisSpec) => {
  const dataSpec = gistVisSpec.dataSpec ?? [];
  const unitSegmentSpec = gistVisSpec.unitSegmentSpec;
  // No dataSpec, revert to noType;
  // More than 10 entries, too long for word-scale vis, revert to noType
  if (dataSpec.length === 0 || dataSpec.length > 10) {
    return ['noType'] as InsightType[];
  }

  const dataSpecLength = dataSpec.length;

  // Task 1: check value isNaN
  const valueHasNaN = dataSpec.some((d) => isNaN(d.value));
  const breakdownHasEmpty = dataSpec.some((d) => d.breakdown === '');

  // Task 2: check insituPos
  const inSituPositionList: string[] = unitSegmentSpec.inSituPosition ?? [];
  const hasGotInsituPos = inSituPositionList.length > 0;

  // Task 3: check attribute string
  const attribute = unitSegmentSpec.attribute ?? '';
  const validForNominalTrend = attribute === 'negative' || attribute === 'positive' || attribute === 'invariable';
  const validForExtreme = attribute === 'maximum' || attribute === 'minimum';

  // Task 4: value attribute
  const sumOfValueValue = dataSpec.reduce((sum, d) => sum + d.value, 0);
  const isInOneToTenRange = dataSpec.every((d) => d.value >= 1 && d.value <= 10);

  const notValidTypes: InsightType[] = [];
  if (breakdownHasEmpty) {
    notValidTypes.push('comparison');
  }
  // value/extreme must have inSitu position
  if (!hasGotInsituPos) {
    notValidTypes.push('value');
    notValidTypes.push('extreme');
  }
  if (valueHasNaN || breakdownHasEmpty) {
    notValidTypes.push('value');
  }
  // extreme must have attribute
  if (!validForExtreme) {
    notValidTypes.push('extreme');
  }

  const checkInvariableTrend = (dataSpec: DataSpec[]): boolean => {
    if (dataSpec.length < 2) return false;
    const variations = dataSpec.slice(1).map((curr, idx) => {
      const prev = dataSpec[idx].value;
      const change = Math.abs(curr.value - prev) / prev;
      return change;
    });
    const VARIATION_THRESHOLD = 0.10; 
    return variations.every(v => v <= VARIATION_THRESHOLD);
  };
  
  // not negative/positive, while there exist empty value, or less than 2 data points, not valid for trend
  if (!validForNominalTrend && breakdownHasEmpty) {
    notValidTypes.push('trend');
  }else if (attribute === 'invariable' && !checkInvariableTrend(dataSpec)) {
    notValidTypes.push('trend');
  }
  // if the sum of value is greater than 1, than not a proportion
  if (valueHasNaN || breakdownHasEmpty || sumOfValueValue > 1) {
    notValidTypes.push('proportion');
  }
  // if value is not in 1-10 range, should not be a rank
  if (!isInOneToTenRange || valueHasNaN || breakdownHasEmpty) {
    notValidTypes.push('rank');
  }

  const validTypes = VIS_INSIGHT_TYPES.filter((type) => !notValidTypes.includes(type as InsightType));
  // noType is always welcome
  validTypes.push('noType');

  return validTypes as InsightType[];
};
