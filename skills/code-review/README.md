# Code Review Skill

Automated code review with comprehensive analysis of bugs, security issues, performance problems, and style violations.

## Features

- **Bug Detection**: Identifies logic errors and potential runtime issues
- **Security Analysis**: Detects common vulnerabilities (SQL injection, XSS, authentication issues, etc.)
- **Performance Review**: Finds bottlenecks, memory leaks, and optimization opportunities
- **Style Checking**: Evaluates code readability and formatting
- **Best Practices**: Suggests design pattern improvements
- **Error Handling**: Verifies proper error handling implementation

## Tools

### analyze_code
Comprehensive code analysis covering all aspects.

```
Agent: "Review this JavaScript code for issues"
Language: javascript
FocusArea: all (or: security, performance, style)
```

### check_security
Focused security review.

```
Agent: "Check this Python function for security vulnerabilities"
Language: python
```

## Configuration

- `strictMode`: Enable stricter rule enforcement (default: false)
- `minSeverityLevel`: Report only issues at this severity or higher (default: Medium)

## Supported Languages

- JavaScript/TypeScript
- Python
- Java
- C#
- Go
- Rust
- SQL
- And more...

## Output Format

Reviews are provided with:
- Severity level (Critical, High, Medium, Low)
- Line references
- Issue descriptions
- Improvement suggestions
- Code examples when helpful
