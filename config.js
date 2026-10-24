/**
 * Wolly LIFF画面の設定（ここだけ書き換えます）
 *  gasUrl     … GASのウェブアプリURL（showLinks の【GASのウェブアプリURL】）
 *  liff.user  … ユーザー用LIFFアプリのLIFF ID（Wolly ログインチャネルで作成）
 *  liff.client… クライアント用LIFFアプリのLIFF ID（Wolly spot で作成）
 *  termsUrl / privacyUrl … 利用規約・プライバシーポリシーの公開URL（同意欄からリンクされます）
 *  surveyUrl … マイページ登録の完了画面に出す「アンケート」のリンク先
 * ※ トークンや管理キーなど秘密の値は、絶対にここへ書かないでください（誰でも見られます）。
 */
window.WOLLY = {
  gasUrl: 'https://script.google.com/macros/s/AKfycbwv5gVNmYIem_rxce3Zo50cPFtFQ2duU6PqFN61-bjXfDycVBzF3nqpSZwsPaLe26aFSQ/exec',
  liff: {
    user: '0000000000-xxxxxxxx',
    client: '0000000000-yyyyyyyy'
  },
  termsUrl: '',
  privacyUrl: '',
  surveyUrl: 'https://mosa0131.my.canva.site/dahp5myj7vg'
};
