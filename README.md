# Heim setup

Action to setup heim on a github runner. It also sets the HEIM_HOME variable and
adds heim to the path.

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
