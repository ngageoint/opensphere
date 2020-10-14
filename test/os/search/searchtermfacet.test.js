goog.require('os.search.SearchTermFacet');

describe('os.search.SearchTermFacet', () => {
  const SearchTermFacet = goog.module.get('os.search.SearchTermFacet');

  const texts = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Aliquam congue erat, et hendrerit nulla fringilla varius.',
    'Etiam rutrum odio id convallis aliquet.'
  ];

  let facet;

  beforeEach(() => {
    facet = new SearchTermFacet();
    facet.getTexts = (item) => texts;
  });

  it('initializes', () => {
    expect(facet.regex_).toBeNull();
    expect(facet.term_).toBeNull();
  });

  it('sets the search term', () => {
    facet.setTerm('');
    expect(facet.regex_).toBeNull();
    expect(facet.term_).toBeNull();

    facet.setTerm('*');
    expect(facet.regex_.toString()).toBe('/(?:)/gi');
    expect(facet.term_).toBe('*');

    facet.setTerm('Lorem ipsum');
    expect(facet.regex_.toString()).toBe('/(lorem|ipsum)/gi');
    expect(facet.term_).toBe('Lorem ipsum');
  });

  it('gets the list of terms', () => {
    let terms;

    // Single term
    facet.setTerm('Lorem');
    terms = facet.getTerms();
    expect(terms.length).toBe(1);
    expect(terms).toContain('lorem');

    // Duplicates removed
    facet.setTerm('Lorem lorem LOREM');
    terms = facet.getTerms();
    expect(terms.length).toBe(1);
    expect(terms).toContain('lorem');

    // Multiple terms
    facet.setTerm('Lorem ipsum');
    terms = facet.getTerms();
    expect(terms.length).toBe(2);
    expect(terms).toContain('lorem');
    expect(terms).toContain('ipsum');

    // Longer, quoted term
    facet.setTerm('"Lorem ipsum"');
    terms = facet.getTerms();
    expect(terms.length).toBe(1);
    expect(terms).toContain('lorem ipsum');

    // Quoted duplicates removed
    facet.setTerm('"Lorem ipsum" "LOREM IPSUM"');
    terms = facet.getTerms();
    expect(terms.length).toBe(1);
    expect(terms).toContain('lorem ipsum');

    // Quoted + unquoted term
    facet.setTerm('"Lorem ipsum" aliquam');
    terms = facet.getTerms();
    expect(terms.length).toBe(2);
    expect(terms).toContain('lorem ipsum');
    expect(terms).toContain('aliquam');

    // Multiple quoted terms
    facet.setTerm('"Lorem ipsum" "hendrerit nulla"');
    terms = facet.getTerms();
    expect(terms.length).toBe(2);
    expect(terms).toContain('lorem ipsum');
    expect(terms).toContain('hendrerit nulla');

    // Multiple quoted/unquoted terms
    facet.setTerm('"Lorem ipsum" fringilla "hendrerit nulla" rutrum');
    terms = facet.getTerms();
    expect(terms.length).toBe(4);
    expect(terms).toContain('lorem ipsum');
    expect(terms).toContain('hendrerit nulla');
    expect(terms).toContain('fringilla');
    expect(terms).toContain('rutrum');
  });

  it('gets the score from an item', () => {
    // Single term
    facet.setTerm('Lorem');
    expect(facet.testInternal()).toBeCloseTo(0.8928571428571429, 10);

    // Multiple terms
    facet.setTerm('Lorem ipsum');
    expect(facet.testInternal()).toBeCloseTo(1.7857142857142858, 10);

    // Longer, quoted term
    facet.setTerm('"Lorem ipsum"');
    expect(facet.testInternal()).toBeCloseTo(1.9642857142857142, 10);

    // Multiple terms with/without quotes
    facet.setTerm('"Lorem ipsum" aliquam');
    expect(facet.testInternal()).toBeCloseTo(2.2102130325814535, 10);

    // Multiple quoted terms
    facet.setTerm('"Lorem ipsum" "hendrerit nulla"');
    expect(facet.testInternal()).toBeCloseTo(3.6137218045112784, 10);

    // Multiple quoted/unquoted terms
    facet.setTerm('"Lorem ipsum" fringilla "hendrerit nulla" rutrum');
    expect(facet.testInternal()).toBeCloseTo(5.8554438982070565, 10);
  });
});
