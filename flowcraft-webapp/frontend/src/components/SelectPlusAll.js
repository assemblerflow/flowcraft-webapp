/**
 * react-select + allOption
 *
 * author: alex.escalante@gmail.com, @alex_escalante
 *
 * Gives users of the fine component react-select the ability to select
 * all options with a single click.
 *
 * We're basically wrapping react-select but using a special option,
 * the "allOption". This option is exclusive of any other option
 * and it never hits the user's onChange() handler because it gets
 * replaced with the whole options list.
 *
 * There are many ways to implement this feature, but this one doesn't
 * affect the rest of your app, and it doesn't take any UI space.
 */
import React from "react";
import PropTypes from "prop-types";
import { default as ReactSelect } from "react-select";

// specify props.allowSelectAll = true to enable!
const Select = props => {
  if (props.allowSelectAll) {
    if (props.value.length !== 0 && props.value.length === props.options.length) {
      return (
        <ReactSelect
          {...props}
          value={[props.allOption]}
          onChange={selected => props.onChange(selected.slice(1))}
        />
      );
    }

    return (
      <ReactSelect
        {...props}
        options={[props.allOption, ...props.options]}
        onChange={selected => {
          if (
            selected.length > 0 &&
            selected[selected.length - 1].value === props.allOption.value
          ) {
            return props.onChange(props.options);
          }
          return props.onChange(selected);
        }}
      />
    );
  }

  return <ReactSelect {...props} />;
};

Select.propTypes = {
  options: PropTypes.array,
  value: PropTypes.any,
  onChange: PropTypes.func,
  allowSelectAll: PropTypes.bool,
  allOption: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string
  })
};

Select.defaultProps = {
  allOption: {
    label: "Select all",
    value: "*"
  }
};

export default Select;