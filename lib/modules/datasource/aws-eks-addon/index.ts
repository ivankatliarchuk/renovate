import {
  type AddonInfo,
  type AddonVersionInfo,
  type Compatibility,
  DescribeAddonVersionsCommand,
  type DescribeAddonVersionsCommandInput,
  type DescribeAddonVersionsCommandOutput,
  EKSClient,
} from '@aws-sdk/client-eks';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { logger } from '../../../logger';
import { cache } from '../../../util/cache/package/decorator';
import * as awsEksAddonVersioning from '../../versioning/aws-eks-addon';
import { Datasource } from '../datasource';
import type { GetReleasesConfig, ReleaseResult } from '../types';
import { EksAddonsFilter } from './schema';

export class AwsEKSAddonDataSource extends Datasource {
  static readonly id = 'aws-eks-addon';

  override readonly defaultVersioning = awsEksAddonVersioning.id;
  override readonly caching = true;
  private readonly clients: Record<string, EKSClient> = {};

  override readonly defaultConfig: Record<string, unknown> | undefined = {
    commitMessageTopic: '{{datasource}}',
    commitMessageExtra: '{{currentVersion}} to {{{newVersion}}}',
  };

  constructor() {
    super(AwsEKSAddonDataSource.id);
  }

  @cache({
    namespace: `datasource-${AwsEKSAddonDataSource.id}`,
    key: ({ packageName }: GetReleasesConfig) => `getReleases:${packageName}`,
  })
  async getReleases({
    packageName: serializedFilter,
  }: GetReleasesConfig): Promise<ReleaseResult | null> {
    const res = EksAddonsFilter.safeParse(serializedFilter);
    if (!res.success) {
      logger.error(
        { err: res.error, serializedFilter },
        'Error parsing eks-addons config.',
      );
      return null;
    }

    const filter = res.data;
    const input: DescribeAddonVersionsCommandInput = {
      kubernetesVersion: filter?.kubernetesVersion,
      addonName: filter?.addonName,
      maxResults: 1,
    };

    const cmd = new DescribeAddonVersionsCommand(input);
    const response: DescribeAddonVersionsCommandOutput =
      await this.getClient(filter).send(cmd);
    const addons: AddonInfo[] = response.addons ?? [];
    return {
      releases: addons
        .flatMap((addon: AddonInfo): AddonVersionInfo[] | undefined => {
          return addon.addonVersions;
        })
        .map((versionInfo: AddonVersionInfo | undefined) => ({
          version: versionInfo?.addonVersion ?? '',
          default:
            versionInfo?.compatibilities?.some(
              (comp: Compatibility): boolean | undefined => comp.defaultVersion,
            ) ?? false,
          compatibleWith: versionInfo?.compatibilities?.flatMap(
            (comp: Compatibility): string | undefined => comp.clusterVersion,
          ),
        }))
        .filter((release) => release.version && release.version !== '')
        .filter((release): boolean => {
          if (filter.default) {
            return release.default && release.default === filter.default;
          }
          return true;
        }),
    };
  }

  private getClient({ region, profile }: EksAddonsFilter): EKSClient {
    const cacheKey = `${region ?? 'default'}#${profile ?? 'default'}`;
    if (!(cacheKey in this.clients)) {
      this.clients[cacheKey] = new EKSClient({
        region: region ?? undefined,
        credentials: fromNodeProviderChain(profile ? { profile } : undefined),
      });
    }
    return this.clients[cacheKey];
  }
}