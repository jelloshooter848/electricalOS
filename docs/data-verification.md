# Data verification log

Every numeric table in `packages/calc` and every entry in `packages/nec-data`
must be checked against the adopted edition before a public release.

| Table / file | Edition | Status | Checked by | Date |
|---|---|---|---|---|
| `calc/src/conductors.ts` AMPACITY_310_16 | 2023 | unverified (transcribed from memory) | | |
| `calc/src/conductors.ts` CIRCULAR_MILS | n/a (AWG standard) | unverified | | |
| `calc/src/conduitFill.ts` CONDUIT_AREA_IN2 | 2023 | unverified | | |
| `calc/src/conduitFill.ts` CONDUCTOR_AREA_IN2 | 2023 | unverified | | |
| `calc/src/ampacity.ts` bundling bands | 2023 | unverified | | |
| `nec-data/data/2023/entries.json` | 2023 | unverified | | |
| `calc/src/ocpd.ts` STANDARD_OCPD_AMPS (240.6(A)) | 2023 | unverified | | |
| `calc/src/boxFill.ts` VOLUME_PER_CONDUCTOR_IN3 (Table 314.16(B)) | 2023 | unverified | | |
| `calc/src/boxFill.ts` COMMON_BOXES (Table 314.16(A)) | 2023 | unverified | | |
| `calc/src/motors.ts` FLC_1PH (Table 430.248) | 2023 | unverified | | |
| `calc/src/motors.ts` FLC_3PH (Table 430.250) | 2023 | unverified | | |
| `calc/src/motors.ts` MOTOR_OCPD_PERCENT (Table 430.52) | 2023 | unverified | | |
| `calc/src/grounding.ts` GEC_ROWS (Table 250.66) | 2023 | unverified | | |
| `calc/src/grounding.ts` EGC_ROWS (Table 250.122) | 2023 | unverified | | |
| `calc/src/transformers.ts` percentages (Table 450.3(B)) | 2023 | unverified | | |
| `calc/src/dwellingLoad.ts` factors (220.82) | 2023 | unverified | | |
| `nec-data/data/jurisdictions.json` statewide adoption | n/a | unverified (snapshot from secondary sources) | | |
