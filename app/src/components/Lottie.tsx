import React from 'react';
import lottie from 'lottie-web';

interface LottieProps {
  eventListeners?: object[],
  options: any,
  height?: string | number,
  width?: string | number,
  isStopped?: boolean,
  isPaused?: boolean,
  speed?: number,
  segments?: number[],
  direction?: number,
  ariaRole?: string,
  ariaLabel?: string,
  isClickToPauseDisabled?: boolean,
  title?: string,
  style?: any,
}

export default class Lottie extends React.Component<LottieProps> {
  static defaultProps = {
    eventListeners: [],
    isStopped: false,
    isPaused: false,
    speed: 1,
    ariaRole: 'button',
    ariaLabel: 'animation',
    isClickToPauseDisabled: false,
    title: '',
  };

  componentDidMount() {
    const {
      options,
      eventListeners,
    } = this.props;

    const {
      loop,
      autoplay,
      animationData,
      rendererSettings,
      segments,
    } = options;

    this.options = {
      container: this.el,
      renderer: 'svg',
      loop: loop !== false,
      autoplay: autoplay !== false,
      segments: segments !== false,
      animationData,
      rendererSettings,
    };

    this.options = { ...this.options, ...options };

    this.anim = lottie.loadAnimation(this.options);
    this.registerEvents(eventListeners);
  }

  componentWillUpdate(nextProps /* , nextState */) {
    /* Recreate the animation handle if the data is changed */
    if (this.options.animationData !== nextProps.options.animationData) {
      this.deRegisterEvents(this.props.eventListeners);
      this.destroy();
      this.options = { ...this.options, ...nextProps.options };
      this.anim = lottie.loadAnimation(this.options);
      this.registerEvents(nextProps.eventListeners);
    }
  }

  componentDidUpdate() {
    if (this.props.isStopped) {
      this.stop();
    } else if (this.props.segments) {
      this.playSegments();
    } else {
      this.play();
    }

    this.pause();
    this.setSpeed();
    this.setDirection();
  }

  componentWillUnmount() {
    this.deRegisterEvents(this.props.eventListeners);
    this.destroy();
    this.options.animationData = null;
    this.anim = null;
  }

  setSpeed() {
    this.anim.setSpeed(this.props.speed);
  }

  setDirection() {
    this.anim.setDirection(this.props.direction);
  }

  play() {
    this.anim.play();
  }

  playSegments() {
    this.anim.playSegments(this.props.segments);
  }

  stop() {
    this.anim.stop();
  }

  pause() {
    if (this.props.isPaused && !this.anim.isPaused) {
      this.anim.pause();
    } else if (!this.props.isPaused && this.anim.isPaused) {
      this.anim.pause();
    }
  }

  destroy() {
    this.anim.destroy();
  }

  registerEvents(eventListeners) {
    eventListeners.forEach((eventListener) => {
      this.anim.addEventListener(eventListener.eventName, eventListener.callback);
    });
  }

  deRegisterEvents(eventListeners) {
    eventListeners.forEach((eventListener) => {
      this.anim.removeEventListener(eventListener.eventName, eventListener.callback);
    });
  }

  handleClickToPause = () => {
    // The pause() method is for handling pausing by passing a prop isPaused
    // This method is for handling the ability to pause by clicking on the animation
    if (this.anim.isPaused) {
      this.anim.play();
    } else {
      this.anim.pause();
    }
  }

  render() {
    const {
      width,
      height,
      ariaRole,
      ariaLabel,
      isClickToPauseDisabled,
      title,
    } = this.props;

    const getSize = (initial) => {
      let size;

      if (typeof initial === 'number') {
        size = `${initial}px`;
      } else {
        size = initial || '100%';
      }

      return size;
    };

    const lottieStyles = {
      width: getSize(width),
      height: getSize(height),
      overflow: 'hidden',
      margin: '0 auto',
      outline: 'none',
      display: 'inline-block',
      ...this.props.style,
    };

    const onClickHandler = isClickToPauseDisabled ? () => null : this.handleClickToPause;

    return (
      // Bug with eslint rules https://github.com/airbnb/javascript/issues/1374
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <span
        ref={(c) => {
          this.el = c;
        }}
        onMouseEnter={() => this.play()}
        onMouseLeave={() => this.stop()}
        style={lottieStyles}
        onClick={onClickHandler}
        role="img"
        aria-label={ariaLabel}
      />
    );
  }
}

