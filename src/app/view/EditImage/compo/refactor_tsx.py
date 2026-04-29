import re

def refactor():
    filepath = r"c:\Users\WildMindAi\Desktop\New folder\wild\src\app\view\EditImage\compo\EditImageInterface.tsx"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to add imports if they don't exist
    if "EditImageSidebar" not in content:
        import_stmt = "import { EditImageSidebar } from './EditImageSidebar';\nimport { EditImageCanvasArea } from './EditImageCanvasArea';\n"
        content = content.replace("import { EditImageExpandFrame }", import_stmt + "import { EditImageExpandFrame }")

    # The outer wrapper
    old_wrapper = '''  return (
    <div className="relative bg-[#07070B]">
      {/* Sticky header like ArtStation */}'''
    new_wrapper = '''  return (
    <div className="body flex flex-1 overflow-hidden relative w-full h-[calc(100vh-48px)] bg-[#0d0d10] font-sans text-[#eeedf5]">
      {/* Sticky header like ArtStation */}'''
    content = content.replace(old_wrapper, new_wrapper)

    # Re-structure the flex layout
    old_flex = '''      <div className="flex flex-1 min-h-0 md:py-1 pt-20 md:mt-10 flex-col md:flex-row">
        {/* Left Sidebar - Controls (on top for mobile, left for desktop) */}
        <div className="w-auto bg-transparent flex flex-col md:h-full rounded-br-2xl mb-3 overflow-hidden relative md:w-[450px] md:ml-4 md:mx-0 mx-0">
          {/* Error Message */}'''
    new_flex = '''      {/* Error Message - Moved to top */}
          {errorMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur border border-red-500/20 rounded-xl px-4 py-2 shadow-2xl">
              <p className="text-white text-sm font-medium">{errorMsg}</p>
            </div>
          )}
      <EditImageSidebar
        imagePreview={
          <div className="w-full h-full">'''
    content = content.replace(old_flex, new_flex)

    # We need to end imagePreview and start parameters.
    # The parameters start around here:
    old_params_start = '''          {/* Feature Preview (GIF banner) - hidden for Live Chat */}'''
    new_params_start = '''          </div>
        }
        parameters={
          <div className="flex flex-col gap-4">
          {/* Feature Preview (GIF banner) - hidden for Live Chat */}'''
    content = content.replace(old_params_start, new_params_start)

    # Now the footer
    old_footer_start = '''            {/* Bottom action buttons under parameters (hidden for Live Chat) */}'''
    new_footer_start = '''          </div>
        }
        footer={
          <div className="flex flex-col gap-2">
            {/* Bottom action buttons under parameters (hidden for Live Chat) */}'''
    content = content.replace(old_footer_start, new_footer_start)

    # Now the canvas area
    old_canvas_start = '''        </div>

        {/* Right Main Area - Image Display (below on mobile, right on desktop) */}
        <div className="flex-1 flex flex-col bg-[#07070B] overflow-hidden md:border-l md:border-white/5">'''
    
    # Wait, the end of footer is right before this `</div>`. So we close the footer prop and close EditImageSidebar.
    new_canvas_start = '''          </div>
        }
      />

      <EditImageCanvasArea
        topBar={
          <div className="flex items-center gap-1 md:gap-2 h-full">
            {/* We will move the feature tabs here! */}
        '''
    content = content.replace(old_canvas_start, new_canvas_start)

    # We need to extract the feature tabs from the Sidebar and move them to topBar.
    # The feature tabs block:
    old_feature_tabs = '''          {/* Feature tabs (two rows on desktop, sliding row on mobile) */}
          <div className="relative md:px-4 md:pt-3 w-auto md:mx-0">
            <div
              className="overflow-x-auto md:overflow-visible"
              ref={featureTabsRef}
              onScroll={handleFeatureTabsScroll}
            >
              <div className="md:grid md:grid-cols-4 flex flex-nowrap md:gap-2 gap-1  md:pl-0 pb-0">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => {
                      setSelectedFeature(feature.id as EditFeature);
                      // Update URL with feature parameter
                      const params = new URLSearchParams(window.location.search);
                      params.set('feature', feature.id);
                      router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });

                      if (feature.id === 'remove-bg') {
                        setModel('851-labs/background-remover');
                      } else if (feature.id === 'upscale') {
                        setModel('philz1337x/crystal-upscaler');
                      } else if (feature.id === 'resize') {
                        setModel('fal-ai/bria/expand');
                      } else if (feature.id === 'vectorize') {
                        setModel('fal-ai/recraft/vectorize' as any);
                      }
                      setProcessing((p) => ({ ...p, [feature.id]: false }));
                    }}
                    className={`text-left bg-white/5 items-center justify-center rounded-lg md:p-1  md:h-18 h-14 w-auto px-2 md:w-auto flex-shrink-0  min-w-[78px] border transition ${selectedFeature === feature.id
                      ? (feature.id === 'resize' ? 'border-[#2F6BFF] bg-[#2F6BFF]/10' : 'border-white/30 bg-white/10')
                      : 'border-white/10 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center gap-0 justify-center  ">
                      <div className={`md:w-6 md:h-6 w-5 h-5 rounded flex items-center justify-center  ${selectedFeature === feature.id ? '' : ''}`}>
                        {feature.id === 'upscale' && (<img src="/icons/scaling.svg" alt="Upscale" className="md:w-6 md:h-6 w-5 h-5" />)}
                        {feature.id === 'remove-bg' && (<img src="/icons/image-minus.svg" alt="Remove background" className="md:w-6 md:h-6 w-5 h-5" />)}
                        {/* {feature.id === 'expand' && (<img src="/icons/resize.svg" alt="Expand" className="w-6 h-6" />)} */}
                        {/* {feature.id === 'erase' && (<img src="/icons/erase.svg" alt="Erase" className="md:w-8 md:h-8 w-5 h-5" />)} */}

                        {feature.id === 'resize' && (<img src="/icons/resize.svg" alt="Resize" className="md:w-5 md:h-5 w-4 h-4" />)}
                        {feature.id === 'fill' && (<img src="/icons/inpaint.svg" alt="Image Fill" className="md:w-6 md:h-6 w-5 h-5" />)}
                        {feature.id === 'vectorize' && (<img src="/icons/vector.svg" alt="Vectorize" className="md:w-7 md:h-7 w-6 h-6" />)}
                        {/* {feature.id === 'reimagine' && (<img src="/icons/reimagine.svg" alt="Reimagine" className="md:w-6 md:h-6 w-5 h-5" />)} */}
                        {feature.id === 'live-chat' && (<img src="/icons/chat.svg" alt="Live Chat" className="md:w-6 md:h-6 w-5 h-5" />)}
                      </div>

                    </div>
                    <div className="flex items-center justify-center pt-1">
                      {feature.id === 'fill' ? (
                        <span className="text-white text-[10px] md:text-xs text-center leading-tight">
                          Erase /<br />Replace
                        </span>
                      ) : (
                        <span className="text-white text-[10px] md:text-sm text-center">{feature.label}</span>
                      )}
                    </div>

                  </button>
                ))}
              </div>
            </div>

            {/* Mobile hint: fixed left arrow, only when scrolled left */}
            {hasLeftScroll && (
              <button
                type="button"
                className="md:hidden absolute top-1/2 -translate-y-5 left-0 pr-1 h-5 flex items-center border-l border-white/10 justify-center bg-white/5 backdrop-blur-lg text-white rounded-r-full"
                onClick={() => {
                  try {
                    const el = featureTabsRef.current;
                    if (el) {
                      el.scrollBy({ left: -120, behavior: 'smooth' });
                    }
                  } catch { }
                }}
                aria-label="Scroll feature tabs left"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            )}

            {/* Mobile hint: fixed right arrow to indicate more tabs */}
            <button
              type="button"
              className="md:hidden  absolute top-1/2 -translate-y-5  right-0 pl-1 h-5  flex items-center border-r border-white/10 justify-center bg-white/5 backdrop-blur-lg text-white rounded-l-full"
              onClick={() => {
                try {
                  const el = featureTabsRef.current;
                  if (el) {
                    el.scrollBy({ left: 120, behavior: 'smooth' });
                  }
                } catch { }
              }}
              aria-label="Scroll feature tabs"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>'''

    # We will remove it from the sidebar and place it formatted in the new_canvas_start replacement.
    content = content.replace(old_feature_tabs, '')

    # Wait, error message was also removed inside the Sidebar, we need to handle that. 
    # Notice we already mapped `old_flex` which contains the error message block.
    # The actual string to remove from `old_flex` to `new_flex` works.

    new_feature_tabs = '''
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => {
                  setSelectedFeature(feature.id as EditFeature);
                  // Update URL with feature parameter
                  const params = new URLSearchParams(window.location.search);
                  params.set('feature', feature.id);
                  router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });

                  if (feature.id === 'remove-bg') {
                    setModel('851-labs/background-remover');
                  } else if (feature.id === 'upscale') {
                    setModel('philz1337x/crystal-upscaler');
                  } else if (feature.id === 'resize') {
                    setModel('fal-ai/bria/expand');
                  } else if (feature.id === 'vectorize') {
                    setModel('fal-ai/recraft/vectorize' as any);
                  }
                  setProcessing((p) => ({ ...p, [feature.id]: false }));
                }}
                className={`flex items-center gap-[5px] px-[11px] py-[6px] rounded-[6px] text-[12.5px] font-medium whitespace-nowrap transition-all duration-150 ${
                  selectedFeature === feature.id
                    ? 'bg-[#222228] text-[#eeedf5] border border-[rgba(255,255,255,0.12)]'
                    : 'text-[#8e8d9e] border border-transparent hover:text-[#eeedf5] hover:bg-[#222228]'
                }`}
              >
                {feature.label === 'Fill' ? 'Erase / Replace' : feature.label}
              </button>
            ))}
          </div>
        }
        canvas={
          <div className="w-full h-full flex flex-col relative">
    '''

    content = content.replace('            {/* We will move the feature tabs here! */}', new_feature_tabs)

    # Finally, close the EditImageCanvasArea properly before the final closing div tag
    # The end of the component looks like this:
    old_end = '''          <style jsx global>{`
            .very-thin-scrollbar {'''
    new_end = '''          </div>
        }
      />
          <style jsx global>{`
            .very-thin-scrollbar {'''
    content = content.replace(old_end, new_end)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Refactor complete.")

if __name__ == '__main__':
    refactor()
