const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { CheckCircle, Calendar, Headphones, Mail, Smartphone, Globe } = require('lucide-react');

const icons = [CheckCircle, Calendar, Headphones, Mail, Smartphone, Globe];
icons.forEach(Icon => {
  console.log(Icon.name);
  console.log(ReactDOMServer.renderToStaticMarkup(React.createElement(Icon, { size: 64, color: '#000000', strokeWidth: 1.5 })));
});
