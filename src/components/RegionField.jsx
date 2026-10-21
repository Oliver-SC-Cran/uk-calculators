import { REGIONS } from './choices'
import { SelectField } from './Fields'

/**
 * The step that asks which income tax rates apply. Scottish income tax goes by
 * where someone's main home is, not where they work. Pages keep the value in
 * state, starting at 'restOfUk', and pass `scottish` to the calculation when
 * it is 'scotland'.
 */
export default function RegionField({ value, onChange, ...rest }) {
  return (
    <SelectField
      id="region"
      label="Where you live"
      hint="Where your main home is, not where you work. A Scottish tax code starts with S."
      value={value}
      onChange={onChange}
      {...rest}
    >
      {Object.entries(REGIONS).map(([region, name]) => (
        <option key={region} value={region}>
          {name}
        </option>
      ))}
    </SelectField>
  )
}
