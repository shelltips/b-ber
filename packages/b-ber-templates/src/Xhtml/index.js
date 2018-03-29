import File from 'vinyl'

class Xhtml {
    static head() {

        // TODO: whitespace should be trimmed from the doc start and end after
        // b-ber runs

        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
            <html xmlns="http://www.w3.org/1999/xhtml"
                xmlns:epub="http://www.idpf.org/2007/ops"
                xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
                epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
            <head>
                <title></title>
                <meta http-equiv="default-style" content="text/html charset=utf-8"/>
                <!-- inject:css -->
                <!-- end:css -->
            </head>
            <body>
        `
    }
    static body() {
        return new File({
            path: 'page.body.tmpl',
            contents: new Buffer('{% body %}'),
        })
    }
    static tail() {
        return `
                <!-- inject:js -->
                <!-- end:js -->
                <!-- inject:metadata -->
                <!-- end:metadata -->
            </body>
        </html>
        `
    }
    static cover({width, height, href}) {
        return `
            <section class="cover" style="text-align: center; padding: 0; margin: 0;">
                <svg xmlns="http://www.w3.org/2000/svg" height="100%" preserveAspectRatio="xMidYMid meet" version="1.1" viewBox="0 0 ${width} ${height}" width="100%" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <image width="${width}" height="${height}" xlink:href="../${href}"/>
                </svg>
            </section>
        `
    }
    static script(type = 'application/javascript', inline = false) {
        return `<script type="${type}" ${inline ? '' : 'src="{% body %}"'}></script>`
    }
    static stylesheet() {
        return `<link rel="stylesheet" type="text/css" href="{% body %}"/>`
    }

    static loi() {
        return `
            <section epub:type="loi" title="Figures" class="chapter figures">
                <header>
                    <h1>Figures</h1>
                </header>
            </section>
        `
    }

    static document() {
        return new File({
            path: 'xhtml.document.tmpl',
            contents: new Buffer(`${Xhtml.head()}
                    {% body %}
                ${Xhtml.tail()}
            `),
        })
    }
}

export default Xhtml
