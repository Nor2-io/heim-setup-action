![Heim Logo](/assets/heim.svg)

[\[Getting Started\]](https://cloud.heim.dev/heim/docs/start-here/getting-started/)
[\[Documentation\]](https://cloud.heim.dev/heim/docs/)

# Heim setup

Action to setup heim on a GitHub runner. It also sets the HEIM_HOME variable and
adds heim to the path.

## Usage

```Yaml
# Latest version
- name: Setup Heim
  id: setup-heim
  uses: Nor2-io/heim-setup-action@v1

# Major version
- name: Setup Heim
  id: setup-heim
  uses: Nor2-io/heim-setup-action@v1
  with:
    version: v1

# Specific version
- name: Setup Heim
  id: setup-heim
  uses: Nor2-io/heim-setup-action@v1
  with:
    version: "1.2.2"
```

## Inputs

| key     | description                                         | required | default |
| ------- | --------------------------------------------------- | -------- | ------- |
| version | the heim version to install, ex: 1.1.1, v1, current | true     | current |

## Outputs

| key      | description                             |
| -------- | --------------------------------------- |
| heimHome | Can be used to set the HEIM_HOME env    |
| bin      | Path to the bin folder for setting PATH |
| runtime  | Path the runtime executable             |
| cli      | Path to the cli executable              |
