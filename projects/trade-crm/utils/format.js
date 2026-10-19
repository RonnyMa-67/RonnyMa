const STAGES = [
  '待联系',
  '询盘',
  '报价',
  '样品',
  '谈判',
  '成交',
  '流失',
];

const LEVELS = ['A', 'B', 'C', 'D'];

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function dateText(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function daysUntil(value) {
  if (!value) return null;
  const target = new Date(value);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / 86400000);
}

function dueText(value) {
  const d = daysUntil(value);
  if (d === null) return '';
  if (d < 0) return '逾期 ' + Math.abs(d) + ' 天';
  if (d === 0) return '今天跟进';
  if (d === 1) return '明天跟进';
  return d + ' 天后';
}

function money(amount, currency) {
  if (amount === undefined || amount === null || amount === '') return '-';
  const symbol = currency === 'CNY' ? '¥' : '$';
  return symbol + Number(amount).toLocaleString('en-US');
}

module.exports = { STAGES, LEVELS, dateText, daysUntil, dueText, money };
