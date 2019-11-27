import 'react-app-polyfill/ie11';
import React from 'react';
import ReactDOM from 'react-dom';
import { Component } from '../src/index';

const Example = () => {
  return <Component />;
};

ReactDOM.render(<Example />, document.getElementById('root'));
