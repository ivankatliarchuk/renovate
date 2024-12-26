import { regEx } from '../../../util/regex';
import { coerceString } from '../../../util/string';
import type { GenericVersion } from '../generic';
import { GenericVersioningApi } from '../generic';
import type { VersioningApi } from '../types';

export const id = 'aws-eks-addon';
export const displayName = 'aws-eks-addon';

export const urls = [];

export const supportsRanges = false;

const versionPattern = regEx(
  '^[vV]?(\\d+(?:\\.\\d+)*)(?<metadata>-eksbuild\\.\\d+)?$',
);

class AwsEKSAddonVersioningApi extends GenericVersioningApi {
  protected _parse(version: string): GenericVersion | null {
    if (!version) {
      return null;
    }
    const matches: RegExpExecArray | null = versionPattern.exec(version);
    if (!matches) {
      return null;
    }
    const [, prefix, suffix] = matches;
    const release: number[] = prefix.split('.').map(Number);
    if (release.length !== 3) {
      return null;
    }
    if (!suffix) {
      return null;
    }
    return { release, suffix: suffix || '' };
  }

  protected override _compare(version: string, other: string): number {
    const compare: number = super._compare(version, other);
    if (compare !== 0) {
      return compare;
    }
    const parsed1: GenericVersion | null = this._parse(version);
    const parsed2: GenericVersion | null = this._parse(other);
    // istanbul ignore if
    if (!(parsed1 && parsed2)) {
      return 1;
    }
    const suffix1 = coerceString(parsed1.suffix);
    const suffix2 = coerceString(parsed2.suffix);
    return suffix1.localeCompare(suffix2);
  }

  override isCompatible(version: string, current: string): boolean {
    const parsed1: GenericVersion | null = this._parse(version);
    const parsed2: GenericVersion | null = this._parse(current);
    return !!(parsed1 && parsed2);
  }
}

export const api: VersioningApi = new AwsEKSAddonVersioningApi();

export default api;