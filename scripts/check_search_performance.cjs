/* Meaningful parser/measurement checks. Run: node scripts/check_search_performance.cjs */
"use strict";
const assert = require("node:assert/strict");
const search = require("../admin/search-performance.js");

const en = search.parse('\uFEFFDate,Clicks,Impressions,CTR,Position\r\n2026-10-02,0,0,0%,\r\n2026-10-01,"1,000","10,000",10%,2.5\r\n', "dates.csv");
assert.equal(en.type, "date");
assert.equal(en.rows[0].label, "2026-10-01");
assert.equal(en.rows[0].clicks, 1000);
assert.equal(en.rows[0].reported_ctr, .1);
assert.equal(en.rows[1].position, null);
assert.deepEqual(search.aggregate(en.rows), {clicks:1000, impressions:10000, position_sum:25000, position_impressions:10000, ctr:.1, position:2.5});
assert.equal(search.aggregate([en.rows[1]]).ctr, null, "zero impressions cannot yield a measured CTR");
assert.equal(search.aggregate([en.rows[1]]).position, null);

const zh = search.parse('热门查询,点击次数,展示次数,点击率,平均排名\n"JevStyle, 本地模型",2,10,20%,1\n"分类\n路由",0,9,0%,—\n"<img src=x onerror=alert(1)>",1,20,5%,3\ntoString,1,2,50%,2', "查询.csv");
assert.equal(zh.type, "query");
assert.equal(zh.rows[0].label, "JevStyle, 本地模型");
assert.equal(zh.rows[0].brand, "brand");
assert.equal(zh.rows[1].label, "分类\n路由");
assert.equal(zh.rows[2].brand, "nonbrand");
assert.equal(zh.overrides.toString, undefined, "prototype names must not become overrides");
assert.equal(search.classifyBrand("JEV-STYLE"), "brand");
assert.equal(search.classifyBrand("jev style"), "brand");
assert.equal(search.classifyBrand("local text classification"), "nonbrand");
assert.equal(search.aggregate(zh.rows).position_impressions, 32, "unknown ranks excluded from rank denominator");
assert.equal(search.aggregate(zh.rows).position, 74 / 32);

const blankRank = search.parse('日期,点击次数,展示次数,排名\n2026-10-01,0,3,null');
assert.equal(blankRank.rows[0].position, null);
const missingRank = search.parse('Date,Clicks,Impressions\n2026-10-01,0,3');
assert.equal(missingRank.rows[0].position, null);
const zeroRank = search.parse('Date,Clicks,Impressions,Position\n2026-10-01,0,0,0\n2026-10-02,1,2,0');
assert.equal(zeroRank.rows[0].position, null, "GSC can export missing rank as zero on zero-impression days");
assert.equal(zeroRank.rows[1].position, null, "zero rank remains unknown even with impressions");
assert.equal(search.aggregate(zeroRank.rows).position, null);
assert.equal(search.aggregate(zeroRank.rows).position_impressions, 0);

for (const text of [
  "", "Date,Clicks,Impressions\n", // empty tables
  'Date,Clicks,Impressions\n"2026-10-01,1,2', // incomplete quote
  'Date,Clicks,Impressions\n"2026-10-01"x,1,2', // junk after quote
  'Date,Clicks,Impressions\n2026-10-01,1', // wrong column count
  'Date,Clicks,Impressions\n2026-10-01,,2', // missing count must not become zero
  'Date,Clicks,Impressions\n2026-10-01,-1,2',
  'Date,Clicks,Impressions\n2026-10-01,NaN,2',
  'Date,Clicks,Impressions\n2026-10-01,1.5,2',
  'Date,Clicks,Impressions\n2026-10-01,9007199254740993,2',
  'Date,Clicks,Impressions\n2026-02-30,1,2',
  'Date,Clicks,Impressions\n2026-13-01,1,2',
  'Date,Clicks,Impressions\n10/01/2026,1,2', // ambiguous date
  'Date,Clicks,Impressions\n2026-10-01,1,2\n2026-10-01,2,4', // duplicate day
  'Query,Clicks,Impressions\n,1,2',
  'Query,Date,Clicks,Impressions\nx,2026-10-01,1,2', // mixed dimensions
  'Query,Clicks,点击次数,Impressions\nx,1,1,2', // duplicate semantic header
  'Date,Clicks,Impressions,Position\n2026-10-01,1,2,0.5'
]) assert.throws(() => search.parse(text), undefined, text);
assert.throws(() => search.parse("x".repeat(search.maxBytes + 1)));
assert.throws(() => search.parse("Query,Clicks,Impressions\n" + Array.from({length:10001}, (_, i) => "q"+i+",0,0").join("\n")));

zh.overrides[zh.rows[0].label] = "nonbrand";
const restored = search.validateSaved(JSON.parse(JSON.stringify({version:1,datasets:{date:en,query:zh}})));
assert.equal(restored.query.overrides[zh.rows[0].label], "nonbrand");
assert.equal(restored.date.imported_at, en.imported_at);
assert.throws(() => search.validateSaved({version:2,datasets:{}}));
assert.throws(() => search.validateSaved({version:1,datasets:{date:{type:"date",rows:[{label:"2026-10-01",clicks:"<b>",impressions:2,position:null}]}}}));
console.log("Search CSV: English/Chinese, quoting/BOM, null/zero, missing data, invalid input, brand review and saved-snapshot checks passed.");
