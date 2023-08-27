import React from 'react';

export class CatchErrors extends React.Component<{
  error?: any;
  onMounted?: (setError: (error?: any) => void) => void;
  errorRenderer?: (error: Error, reset: () => any) => React.ReactNode;
  reset?: () => any;
  children: any;
},any> {
  reset: () => any;

  constructor(props) {
    super(props);
    this.state = { error: undefined };

    this.reset = () => {
      this.setState({ error: undefined });
      this?.props?.reset && this?.props?.reset();
    };
  }

  static getDerivedStateFromError(error) {
    console.log('getDerivedStateFromError', error);
    return { error };
  }
  componentDidCatch(error, errorInfo) {
    console.log('componentDidCatch', error, errorInfo);
  }
  componentDidMounted() {
    this?.props?.onMounted && this?.props?.onMounted((error) => this.setState({ error: error }));
  }

  errorRenderer = (error, reset) => <></>;

  render() {
    const error = this.props.error || this.state.error;
    if (error) {
      return this?.props?.errorRenderer ? this?.props?.errorRenderer(error, this.reset) : this?.errorRenderer(error, this.reset);
    }

    return this.props.children; 
  }
}