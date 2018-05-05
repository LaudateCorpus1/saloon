import * as expressionFns from './expressionFunctions';
import logger from './logger';

/**
 * Parses an expression.
 * @param {string} exp The raw model value.
 * @returns {string} The parsed model value.
 */
function parse(exp) {
  const fnArgsStart = exp.indexOf('(');
  const fnArgsEnd = exp.indexOf(')');
  const fnName = exp.substring(2, fnArgsStart);

  if (typeof expressionFns[fnName] !== 'function') {
    logger.warn(`Expression function not found: ${fnName}`);
    return exp;
  }

  let args = exp.substring(fnArgsStart + 1, fnArgsEnd);

  if (args.length) {
    args = args.split(',').map((arg) => {
      const parsed = parseInt(arg, 10);
      return Number.isNaN(parsed) ? arg.trim().replace(/'/g, '') : parsed;
    });
  }

  return expressionFns[fnName](...args || []);
}

/**
 * @param {String} value
 * Decides if it is an expression and returns the bool
 */
export function shouldParseValue(value) {
  const EXP_START = '{{';
  const EXP_END = '}}';
  if (!value || typeof value !== 'string') {
    return false;
  }
  const start = value.indexOf(EXP_START);
  const end = value.indexOf(EXP_END);
  if (start !== -1 && end !== -1) {
    return true;
  }
  return false;
}

/**
 * @param {Object<>Array} obj
 * recurses over a given data structure in context of a persona param
 * and evaluates its expressions
 */
export function recursePersonaParams(layer) {
  return Object.keys(layer).reduce((accumulator, key) => {
    const newAccumulator = { ...accumulator };
    const value = layer[key];
    if (typeof value === 'object' && value !== null) {
      newAccumulator[key] = recursePersonaParams(value);
    } else {
      newAccumulator[key] = shouldParseValue(value) ? parse(value) : value;
    }
    return newAccumulator;
  }, {});
}
/**
 * @param {<Object>} resource a resource in context persona resource objects
 * @returns {<Object>} the resource templated per templateProcessor rules
 */
export default function evaluateExpressions(resource) {
  return {
    ...resource,
    params: recursePersonaParams(resource.params),
  };
}
