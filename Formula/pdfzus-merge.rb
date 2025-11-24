require "language/node"

class PdfzusMerge < Formula
  desc "Local command-line PDF merge tool built with pdf-lib"
  homepage "https://pdfzus.de"
  url "https://github.com/andy/pdfzus/releases/download/v0.1.0/pdfzus-merge-0.1.0.tar.gz"
  sha256 :no_check
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

