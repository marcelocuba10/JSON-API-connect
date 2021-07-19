# JSON API connect - Community Connector for Data Studio

*This is not an official Google product*

This [Data Studio] [Community Connector] lets users query data from a [JSON]
data source.

![Screenshot of the JSON connect connector configuration in Data Studio][screenshot]

## Deploy the connector

1.  Visit [Google Apps Script](https://script.google.com/) and create a new
    project.
1.  In the Apps Script development environment, select **View > Show manifest
    file**. Replace the contents of this file with the content of the
    `src/appsscript.json` file from the repository.
1.  For every `.js` file under `src`, you will need to create a file in Apps
    Scripts (**File > New > Script File**), then copy over the content from the
    repository.
1.  To use the Community Connector in Data Studio, follow the
    [guide on Community Connector Developer site](https://developers.google.com/datastudio/connector/use).

## Using the connector in Data Studio

Once you've set up and deployed the connector, follow the
[Use a Community Connector] guide to use the connector in Data Studio.

**Note**: After using the connector in Data Studio, as long as you do not
[revoke access], it will remain listed in the [connector list] for easy access
when [creating a new data source].

## Configuration

#### JSON data source URL
Enter the URL of a JSON data source. (Demo content: [https://jsonplaceholder.typicode.com/comments])

#### Caching
Enable caching by checking the 'Cache response' checkbox. This is usefull with large datasets. The cache will expire after ten minutes. The rows in your dataset may not exceed 100KB

## Troubleshooting

### This app isn't verified

When authorizing a community connector, an OAuth consent screen may be
presented to you with a warning "This app isn't verified". This is because the
connector has requested authorization to make requests to an external API
(E.g. to fetch data from the service you're connecting to). If you have
followed the deployment guide to setup a community connector and are
using your own personal deployment you do not need to complete the verification
process and instead can continue past this warning by clicking **Advanced > Go
to {Project Name} (unsafe)**.

If you are using a community connector that you did not
personally deploy it is recommended that you only proceed with
community connectors from trusted sources.

For distribution or non-personal use cases the project must eventually go
through the [verification process][verify] to remove that warning and other
limitations.

For additional details see [OAuth Client Verification][verify].

[verify]: https://developers.google.com/apps-script/guides/client-verification

[Data Studio]: https://datastudio.google.com
[Community Connector]: https://developers.google.com/datastudio/connector
[JSON]: https://www.json.org/
[screenshot]: json-connect.png
[Use a Community Connector]: https://developers.google.com/datastudio/connector/use
[revoke access]: https://support.google.com/datastudio/answer/9053467
[connector list]: https://datastudio.google.com/c/datasources/create
[creating a new data source]: https://support.google.com/datastudio/answer/6300774
[https://jsonplaceholder.typicode.com/comments]: https://jsonplaceholder.typicode.com/comments
[This app isn't verified]: ../verification.md
