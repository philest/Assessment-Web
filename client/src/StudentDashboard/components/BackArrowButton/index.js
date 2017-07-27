// @flow

import React from 'react';
import styles from './styles.css'

type props = {
  title: string,
  subtitle: string,
  onClick: Function,
  disabled: boolean,
  pulsatingArrow: boolean,
  style: {},
};

function RectangleButton ({
  title = "",
  subtitle = "",
  onClick = function () { return null },
  disabled = false,
  pulsatingArrow = false,
  style = {},
} : props) {
  return (
    <div
      className={disabled ? styles.disabledButtonContainer : styles.arrowButtonContainer}
      style={style}
      onClick={() => (!disabled && onClick())}
    >

      <div className={styles.arrowButtonTextContainer}>
      
        <div className={styles.arrowButtonTitle}>
          { pulsatingArrow 
            && !disabled
            && <i className={['fa fa-angle-right', styles.pulsatingArrow].join(' ')}></i>
          }
          {title}
          
        </div>

        {
          subtitle
          && (subtitle !== '')
          && <div className={styles.arrowButtonSubtitle}> {subtitle} </div>
        }

      </div>

    </div>
  )
}

export default RectangleButton
