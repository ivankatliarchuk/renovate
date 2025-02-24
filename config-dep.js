

module.exports = {
  "platform": "github",
  "token": process.env.RENOVATE_TOKEN,
  "repositories": [
    "ik-workshop/external-dns-fork-renovate-bootstrap"
  ],
  "gitAuthor": "Renovate Bot <bot@renovateapp.com>",
  "prConcurrentLimit": 0,
  "prHourlyLimit": 0,
  "pruneStaleBranches": true,
  "recreateWhen": "always",
  "onboarding": false,
  "requireConfig": "optional",
  "baseBranches": ["master", "main"],
  "hostRules": [
    {
      "hostType": "docker",
      "matchHost": "docker.io",
      "username": process.env.RENOVATE_DOCKER_HUB_USERNAME,
      "password": process.env.RENOVATE_DOCKER_HUB_TOKEN
    }
  ],
  "addLabels": [
    "renovate"
  ],
  "rebaseWhen": "conflicted",
  "enabledManagers": [ // supported managers https://docs.renovatebot.com/modules/manager/
    "regex"
  ],
  "packageRules": [ // https://docs.renovatebot.com/configuration-options/#packagerules
  ],
  "customManagers": [ // https://docs.renovatebot.com/modules/manager/regex/
    {
      // to capture registry.k8s.io/external-dns/external-dns:<version> in *.md files
      "customType": "regex",
      "fileMatch": [
        ".*\\.md$"
      ],
      "matchStrings": [
        "(?<depName>registry.k8s.io\/external-dns\/external-dns):(?<currentValue>.*)"
      ],
      "depNameTemplate": "kubernetes-sigs/external-dns",
      "datasourceTemplate": "github-releases",
      "versioningTemplate": "semver"
    }
  ]
}

//
// {
//   "customType": "regex",
//     "fileMatch": [
//       "^README\\.md$"
//     ],
//       "matchStrings": [
//         "renovate-version: (?<currentValue>[^\\s]+)"
//       ],
//         "depNameTemplate": "ghcr.io/renovatebot/renovate",
//           "datasourceTemplate": "docker"
// },
