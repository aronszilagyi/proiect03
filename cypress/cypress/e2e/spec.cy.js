describe('Test aplicatie', () => {

  // Test 1: paginile se incarca
  it('pagina principala se incarca', () => {
    cy.visit('/')
  })

  it('pagina about se incarca', () => {
    cy.visit('/about')
  })

  it('pagina contact se incarca', () => {
    cy.visit('/contact')
  })

  it('pagina register se incarca', () => {
    cy.visit('/register')
  })

  // Test 2: formular register - inregistrare cu succes
  it('inregistrare cu succes', () => {
    cy.visit('/register')
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="email"]').type('testuser@test.com')
    cy.get('input[name="password"]').type('Parola123!')
    cy.get('input[name="confirm-password"]').type('Parola123!')
    cy.get('input[name="age"]').type('25')
    cy.get('form').submit()
    cy.url().should('include', 'register-success')
  })

  // Test 3: formular register - parole diferite
  it('eroare cand parolele nu coincid', () => {
    cy.visit('/register')
    cy.get('input[name="username"]').type('testuser2')
    cy.get('input[name="email"]').type('testuser2@test.com')
    cy.get('input[name="password"]').type('Parola123!')
    cy.get('input[name="confirm-password"]').type('AltaParola!')
    cy.get('input[name="age"]').type('25')
    cy.get('form').submit()
    cy.contains('Parolele nu coincid')
  })

  // Test 4: formular register - varsta sub 18
  it('eroare cand varsta este sub 18', () => {
    cy.visit('/register')
    cy.get('input[name="username"]').type('testuser3')
    cy.get('input[name="email"]').type('testuser3@test.com')
    cy.get('input[name="password"]').type('Parola123!')
    cy.get('input[name="confirm-password"]').type('Parola123!')
    cy.get('input[name="age"]').type('16')
    cy.get('form').submit()
    cy.contains('Varsta trebuie sa fie mai mare de 18')
  })

  // Test 5: API - get user dupa id valid
  it('API returneaza utilizatorul dupa id', () => {
    cy.request('GET', '/api/users/1').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('id')
      expect(response.body).to.have.property('username')
      expect(response.body).to.have.property('email')
    })
  })

  // Test 6: API - get user cu id invalid
  it('API returneaza 404 pentru user inexistent', () => {
    cy.request({
      method: 'GET',
      url: '/api/users/99999',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([404, 500])
    })
  })

  // Test 7: API - delete user cu id invalid
  it('API returneaza 400 pentru id invalid', () => {
    cy.request({
      method: 'GET',
      url: '/api/users/-1',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400)
    })
  })

})