# SEO Audit Skill

Comprehensive SEO analysis and optimization recommendations for improving search engine visibility and organic traffic.

## Features

- **Meta Tag Analysis**: Evaluate title, description, and structured data
- **Content Optimization**: Analyze keyword placement, content depth, and readability
- **Technical SEO**: Check page speed, mobile responsiveness, and crawlability
- **Link Profile**: Analyze backlinks and internal linking structure
- **Mobile & Core Web Vitals**: Assess performance metrics
- **Competitive Analysis**: Benchmark against competitors
- **Keyword Research**: Identify optimization opportunities

## Tools

### analyze_seo
Full website SEO analysis.

```
Agent: "Audit my website's SEO"
URL: https://example.com
FocusAreas: ["technical", "content", "links"] (or: all)
```

### keyword_analysis
Research and analyze target keywords.

```
Agent: "Analyze ranking potential for keyword 'sustainable packaging'"
TargetKeyword: sustainable packaging
CurrentRanking: 25
```

### competitive_analysis
Compare your SEO metrics with competitors.

```
Agent: "Compare our SEO with main competitors"
TargetUrl: https://mysite.com
Competitors: ["https://competitor1.com", "https://competitor2.com"]
```

## Configuration

- `prioritizeQuickWins`: Focus on easy-to-implement optimizations first (default: true)
- `includeCompetitorAnalysis`: Enable competitor benchmarking (default: false)
- `targetMarket`: Geographic or market focus for local SEO

## SEO Scoring

Recommendations are prioritized by:
- **Impact**: High/Medium/Low SEO benefit
- **Effort**: Implementation difficulty level
- **Quick Wins**: Easy fixes with measurable impact

## Output

Audits include:
- Current status assessment
- Priority action items
- Implementation guidance
- Expected timeline and impact
- Best practice references
