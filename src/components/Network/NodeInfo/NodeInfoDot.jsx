import React, { Component } from 'react'
import styled, { css, keyframes } from 'styled-components'
import PropTypes from 'prop-types'
import moment from 'moment'
import PieChart from 'react-minimal-pie-chart'

export default class NodeInfoDot extends Component {
  static propTypes = {
    /** Active network */
    active: PropTypes.oneOf(['remote', 'local']).isRequired,
    /** Current network */
    network: PropTypes.oneOf(['main', 'rinkeby', 'kovan', 'private'])
      .isRequired,
    /** Local network data */
    local: PropTypes.shape({
      blockNumber: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired,
      sync: PropTypes.shape({
        highestBlock: PropTypes.number.isRequired,
        currentBlock: PropTypes.number.isRequired,
        startingBlock: PropTypes.number.isRequired
      }).isRequired
    }).isRequired,
    /** Remote network data */
    remote: PropTypes.shape({
      blockNumber: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired
    }).isRequired,
    /** If component is stickied to apply drop shadow on dot */
    sticky: PropTypes.bool
  }

  static isNewBlock(prevProps, newProps) {
    let isNewBlock
    if (prevProps.active === 'remote') {
      isNewBlock = prevProps.remote.blockNumber !== newProps.remote.blockNumber
    } else {
      isNewBlock = prevProps.local.blockNumber !== newProps.local.blockNumber
    }
    return isNewBlock
  }

  constructor(props) {
    super(props)
    this.state = {
      pulseColor: '',
      diffTimestamp: moment().unix()
    }
  }

  componentDidMount() {
    // NOTE: This component should update diff every second
    this.diffInterval = setInterval(() => {
      this.setState({ diffTimestamp: moment().unix() })
    }, 1000)
  }

  componentDidUpdate(prevProps) {
    this.pulseIfNewBlock(prevProps)
  }

  componentWillUnmount() {
    clearInterval(this.diffInterval)
  }

  pulseIfNewBlock(props) {
    // If new block arrived, add animation to light
    if (NodeInfoDot.isNewBlock(props, this.props)) {
      let pulseColor

      if (props.active === 'remote') {
        pulseColor = 'orange'
      } else if (props.active === 'local') {
        if (props.network === 'main') {
          pulseColor = 'green'
        } else {
          pulseColor = 'blue'
        }
      }

      this.setState({ pulseColor }, () => {
        setTimeout(() => {
          this.setState({ pulseColor: '' })
        }, 2000)
      })
    }
  }

  secondsSinceLastBlock() {
    const { active } = this.props
    const { diffTimestamp } = this.state
    const lastBlock = moment.unix(this.props[active].timestamp) // eslint-disable-line
    return moment.unix(diffTimestamp).diff(lastBlock, 'seconds')
  }

  render() {
    const { active, network, local, remote, sticky } = this.props
    const { pulseColor } = this.state

    let dotColor

    const colorMainnet = '#7ed321'
    const colorTestnet = '#00aafa'
    const colorRed = '#e81e1e'

    if (network === 'main') {
      dotColor = colorMainnet
    } else {
      dotColor = colorTestnet
    }
    if (active === 'remote' || local.syncMode === 'nosync') {
      dotColor = 'orange'
    }
    if (this.secondsSinceLastBlock() > 60) {
      dotColor = colorRed
    }

    const { highestBlock, currentBlock, startingBlock } = local.sync
    const progress =
      ((currentBlock - startingBlock) / (highestBlock - startingBlock)) * 100

    return (
      <div className="pie-container">
        <StyledLight
          pulseColor={pulseColor}
          sticky={sticky}
          style={{
            backgroundColor: dotColor
          }}
        >
          {currentBlock > 0 && dotColor !== colorRed && (
            <PieChart
              startAngle={-90}
              data={[
                {
                  value: progress || 0,
                  key: 1,
                  color: network === 'main' ? colorMainnet : colorTestnet
                },
                {
                  value: 100 - (progress || 1),
                  key: 2,
                  color: remote.blockNumber > 100 ? 'orange' : 'red'
                }
              ]}
            />
          )}
        </StyledLight>
      </div>
    )
  }
}

const beaconOrange = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 165, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0);
  }
`

const beaconGreen = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(36, 195, 58, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(36, 195, 58, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(36, 195, 58, 0);
  }
`

const beaconBlue = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0, 170, 250, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 170, 250, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 170, 250, 0);
  }
`

const StyledLight = styled.div`
  position: relative;
  z-index: 1;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  transition: background-color ease-in-out 5s;

  svg {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    height: 16px;
  }

  ${props =>
    props.sticky &&
    css`
      box-shadow: inset rgba(0, 0, 0, 0.3) 0 1px 3px;
    `}

  ${props =>
    props.pulseColor === 'orange' &&
    css`
      animation: ${beaconOrange} ease-in-out;
      animation-duration: 2s;
    `}

  ${props =>
    props.pulseColor === 'green' &&
    css`
      animation: ${beaconGreen} ease-in-out;
      animation-duration: 2s;
    `}

  ${props =>
    props.pulseColor === 'blue' &&
    css`
      animation: ${beaconBlue} ease-in-out;
      animation-duration: 2s;
    `}
`
