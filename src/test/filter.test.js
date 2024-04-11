const validUsername1 = "validUsername1",
    validUsername2 = "thisIsAValidName",
    validEmail1 = "test123@gmail.com",
    validEmail2 = "123test@gmail.com",
    validPassword1 = "ThisIsSecure!123",
    validPassword2 = "lessSecure2@",

    mockInvoice1 = { file: { amount: 125.45,
                             title: "Business" } },
    mockInvoice2 = { "file": "{\"amount\": \"123.45\", \"title\": \"Business\" }" },
    filteredWord = "Business",
    invalidFilteredWord = "Bisnus",
    emptyFilteredWord = "",
    falseId = 0;
const request = require("supertest");
const assert = require("assert");
const app = require("../main/server");
const server = require("../main/server"),

    invalid_token = 0;

// 1. clear
// 2. register and login 2 users
// 3. create 3 invoices, 2 belonging to user1, 1 belonging to user2
// 4. filter for the 2nd invoice belonging to user1
// 5. error case for filtered word on invoice belonging to wrong user
// 6. error case for filtered word on invoice in trash
// 7. error case for filtered word not found
// 8. error case for no matches for filtered word

describe("Testing filtering of invoices", function() {
    it("General tests for invoice filtering", async function() {
        // Setup user and login process
        await request(app)
            .delete("/clear")
            .expect(200)
            .expect("Content-Type", /application\/json/)
            .expect({"success": true});

        await request(app)
            .post("/users")
            .send({ username: validUsername1, email: validEmail1, password: validPassword1 })
            .expect(200)
            .expect("Content-Type", /application\/json/)
            .expect({"success": true});

        await request(app)
            .post("/users")
            .send({ username: validUsername2, email: validEmail2, password: validPassword2 })
            .expect(200)
            .expect("Content-Type", /application\/json/)
            .expect({"success": true});

        const user1 = await request(app)
            .post("/users/login")
            .send({ username: validUsername1, password: validPassword1 })
            .expect(200)
            .expect("Content-Type", /application\/json/);

        // Using assert to check for each type
        assert.strictEqual(user1.body.success, true);
        assert.strictEqual(typeof user1.body.token, "string");

        const user2 = await request(app)
            .post("/users/login")
            .send({ username: validUsername2, password: validPassword2 })
            .expect(200)
            .expect("Content-Type", /application\/json/);

        // 1: create invoice1
        const invoice1 = await request(app)
            .post("/invoices")
            .set("token", user1.body.token)
            .send({ invoice: mockInvoice1 })
            .expect(200);

        assert.strictEqual(invoice1.body.success, true);
        assert.strictEqual(typeof invoice1.body.invoiceId, "number");

         // 1: create invoice2
         const invoice2 = await request(app)
            .post("/invoices")
            .set("token", user2.body.token)
            .send({ invoice: mockInvoice2 })
            .expect(200);

        assert.strictEqual(invoice2.body.success, true);
        assert.strictEqual(typeof invoice2.body.invoiceId, "number");

        const filteredInvoice = await request(app)
            .get(`/invoices/search/${filteredWord}`)
            .set("token", user1.body.token)
            .expect(200)
            .expect("Content-Type", /application\/json/)
            

        console.log(filteredInvoice.body);

        // invoices must belong to user
        // invoices must fit the keyword exactly, possibly using filter, includes, tolower
        assert.strictEqual(filteredInvoice.body.success, true);
        console.log(invoice1.body);
        assert.strictEqual(filteredInvoice.body.filteredInvoices.invoiceId, invoice1.body.invoiceId);
        console.log("here", mockInvoice1.file);
        assert.strictEqual(filteredInvoice.body.filteredInvoices.invoiceName, mockInvoice1.file.title);
        assert.strictEqual(filteredInvoice.body.filteredInvoices.trashed, false);

      

        // 6. error case for filtered word on invoice in trash
        const moveToTrashResult = await request(app)
            .delete(`/invoices/${invoice1.body.invoiceId}`)
            .set("token", user1.body.token)
            .expect(200)
            .expect("Content-Type", /application\/json/);

        assert.strictEqual(moveToTrashResult.body.success, true)

        await request(app)
            .get(`/invoices/search/${filteredWord}`)
            .set("token", user1.body.token)
            .expect(401)
            .expect("Content-Type", /application\/json/)
            .expect({"success": false});

        // 7. error case for filtered word not found
        // is this error case 400?
        await request(app)
            .get(`/invoices/search/${invalidFilteredWord}`)
            .set("token", user1.body.token)
            .expect(400)
            .expect("Content-Type", /application\/json/)
            .expect({"success": false});

        // 8. error case for empty string for filtered word
        await request(app)
            .get(`/invoices/search/${emptyFilteredWord}`)
            .set("token", user1.body.token)
            .expect(400)
            .expect("Content-Type", /application\/json/)
            .expect({"success": false});
        
    });
});

server.close();