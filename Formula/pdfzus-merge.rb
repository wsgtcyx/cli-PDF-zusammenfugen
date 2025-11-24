require "language/node"

class PdfzusMerge < Formula
  desc "Local command-line PDF merge tool built with pdf-lib"
  homepage "https://pdfzus.de"
  url "https://github.com/wsgtcyx/cli-PDF-zusammenfugen/releases/download/v0.1.0/pdfzus-merge-0.1.0.tgz"
  sha256 :"72f7491dd323d7bb51686d78a518dd2192acfdf59f0bd82dd99defccbe51345e"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    output = shell_output("#{bin}/pdfzus-merge --help")
    assert_match "pdfzus-merge", output
  end
end

